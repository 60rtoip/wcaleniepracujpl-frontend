import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import Modal from '../components/Modal'

const APPLICATION_STATUS_OPTIONS = ['submitted', 'reviewing', 'rejected', 'accepted']

const emptyJobForm = {
  company_id: '',
  title: '',
  location: '',
  employment_type: '',
  description: '',
  tags: '',
}

function normalizeError(error){
  return error?.payload?.detail || error?.payload || error?.message || String(error)
}

function parseTagList(tagText){
  return tagText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function jobToForm(job){
  return {
    company_id: String(job.company_id || ''),
    title: job.title || '',
    location: job.location || '',
    employment_type: job.employment_type || '',
    description: job.description || '',
    tags: Array.isArray(job.tags) ? job.tags.join(', ') : '',
  }
}

export default function RecruiterDashboard({ currentUser, authReady }){
  const [companies, setCompanies] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [jobDraft, setJobDraft] = useState(emptyJobForm)
  const [editingJobId, setEditingJobId] = useState(null)
  const [companyMemberDraft, setCompanyMemberDraft] = useState({})
  const [applicationStatusDraft, setApplicationStatusDraft] = useState({})

  const isRecruiter = currentUser?.role === 'recruiter'

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(selectedJobId)),
    [jobs, selectedJobId],
  )

  async function loadCompanies(){
    const data = await api.getJSON('/companies')
    setCompanies(Array.isArray(data) ? data : [])
  }

  async function loadJobs(){
    const data = await api.getJSON('/jobs/me')
    const list = Array.isArray(data) ? data : []
    setJobs(list)
    if(!selectedJobId && list.length > 0){
      setSelectedJobId(String(list[0].id))
    }
  }

  async function loadApplications(jobId){
    if(!jobId){
      setApplications([])
      return
    }
    const data = await api.getJSON(`/applications/jobs/${jobId}`)
    const list = Array.isArray(data) ? data : []
    setApplications(list)
    setApplicationStatusDraft((current) => {
      const next = { ...current }
      for(const application of list){
        if(!next[application.id]) next[application.id] = application.status
      }
      return next
    })
  }

  async function refreshAll(jobId = selectedJobId){
    await Promise.all([loadCompanies(), loadJobs()])
    if(jobId) await loadApplications(jobId)
  }

  useEffect(() => {
    if(!authReady || !isRecruiter) return

    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([loadCompanies(), loadJobs()])
      .catch((err) => {
        if(alive) setError(normalizeError(err))
      })
      .finally(() => {
        if(alive) setLoading(false)
      })

    return () => { alive = false }
  }, [authReady, isRecruiter])

  useEffect(() => {
    if(!authReady || !isRecruiter || !selectedJobId) return
    let alive = true
    setLoading(true)
    setError(null)
    loadApplications(selectedJobId)
      .catch((err) => {
        if(alive) setError(normalizeError(err))
        if(alive) setApplications([])
      })
      .finally(() => {
        if(alive) setLoading(false)
      })
    return () => { alive = false }
  }, [authReady, isRecruiter, selectedJobId])

  async function createCompany(payload){
    try{
      await api.postJSON('/companies', payload)
      await loadCompanies()
      setCompanyModalOpen(false)
      setError(null)
    }catch(err){
      setError(normalizeError(err))
    }
  }

  async function addCompanyRecruiter(companyId, recruiterUserId){
    try{
      await api.postJSON(`/companies/${companyId}/recruiters`, {
        recruiter_user_id: Number(recruiterUserId),
      })
      setCompanyMemberDraft((current) => ({ ...current, [companyId]: '' }))
      await loadCompanies()
      setError(null)
    }catch(err){
      setError(normalizeError(err))
    }
  }

  function openCreateJobModal(){
    setEditingJobId(null)
    setJobDraft((current) => ({
      ...emptyJobForm,
      company_id: current.company_id || String(companies[0]?.id || ''),
    }))
    setJobModalOpen(true)
  }

  function openEditJobModal(job){
    setEditingJobId(job.id)
    setJobDraft(jobToForm(job))
    setJobModalOpen(true)
  }

  async function saveJob(){
    const payload = {
      title: jobDraft.title.trim(),
      location: jobDraft.location.trim() || null,
      employment_type: jobDraft.employment_type.trim() || null,
      description: jobDraft.description.trim(),
      tags: parseTagList(jobDraft.tags),
    }

    if(!payload.title || !payload.description){
      setError('Title and description are required.')
      return
    }

    try{
      if(editingJobId){
        await api.putJSON(`/jobs/${editingJobId}`, payload)
      }else{
        await api.postJSON('/jobs', {
          ...payload,
          company_id: Number(jobDraft.company_id),
        })
      }
      setJobModalOpen(false)
      setEditingJobId(null)
      setJobDraft(emptyJobForm)
      await refreshAll(selectedJobId)
      setError(null)
    }catch(err){
      setError(normalizeError(err))
    }
  }

  async function deleteJob(jobId){
    if(!window.confirm(`Delete job #${jobId}?`)) return
    try{
      await api.deleteJSON(`/jobs/${jobId}`)
      const remainingJobs = jobs.filter((job) => job.id !== jobId)
      setJobs(remainingJobs)
      const nextSelectedJobId = String(remainingJobs[0]?.id || '')
      setSelectedJobId(nextSelectedJobId)
      if(nextSelectedJobId){
        await loadApplications(nextSelectedJobId)
      }else{
        setApplications([])
      }
      setError(null)
    }catch(err){
      setError(normalizeError(err))
    }
  }

  async function saveApplicationStatus(applicationId){
    const status = applicationStatusDraft[applicationId]
    try{
      await api.patchJSON(`/applications/${applicationId}/status`, { status })
      await loadApplications(selectedJobId)
      setError(null)
    }catch(err){
      setError(normalizeError(err))
    }
  }

  if(!authReady) return <p>Checking session...</p>
  if(!isRecruiter) return <p>Please log in as a recruiter to access this dashboard.</p>

  return (
    <div>
      <h2>Recruiter dashboard</h2>
      <p>Manage companies, jobs, and applications from one place.</p>

      {loading && <p>Loading recruiter data…</p>}
      {error && <p style={{ color: 'red' }}>Error: {String(error)}</p>}

      <section style={{ marginBottom: 24 }}>
        <h3>Companies</h3>
        <button type="button" onClick={() => setCompanyModalOpen(true)}>Create company</button>
        <ul>
          {companies.map((company) => (
            <li key={company.id} style={{ marginBottom: 12 }}>
              <strong>{company.name}</strong>
              <div>{company.location || 'No location'}</div>
              <div>{company.website_url || 'No website'}</div>
              <div>{company.description || 'No description'}</div>
              <label style={{ display: 'block', marginTop: 8 }}>
                Recruiter user id
                <input
                  value={companyMemberDraft[company.id] || ''}
                  onChange={(event) => setCompanyMemberDraft((current) => ({ ...current, [company.id]: event.target.value }))}
                  type="number"
                  min="1"
                />
              </label>
              <button
                type="button"
                onClick={() => addCompanyRecruiter(company.id, companyMemberDraft[company.id])}
                style={{ marginTop: 6 }}
              >
                Add recruiter member
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Jobs</h3>
        <button type="button" onClick={openCreateJobModal}>Create job</button>
        <ul>
          {jobs.map((job) => (
            <li key={job.id} style={{ marginBottom: 12 }}>
              <strong>{job.title}</strong>
              <div>Job id: {job.id} | Company id: {job.company_id} | Status: {job.moderation_status}</div>
              <div>Tags: {Array.isArray(job.tags) && job.tags.length > 0 ? job.tags.join(', ') : 'No tags'}</div>
              <button type="button" onClick={() => setSelectedJobId(String(job.id))} style={{ marginTop: 6 }}>
                View applications
              </button>
              <button type="button" onClick={() => openEditJobModal(job)} style={{ marginLeft: 8 }}>Edit</button>
              <button type="button" onClick={() => deleteJob(job.id)} style={{ marginLeft: 8 }}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Applications for selected job</h3>
        <label>
          Job
          <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
            <option value="">Select a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                #{job.id} {job.title}
              </option>
            ))}
          </select>
        </label>

        {selectedJob && <p>Showing applications for {selectedJob.title}.</p>}

        <ul>
          {applications.map((application) => (
            <li key={application.id} style={{ marginBottom: 12 }}>
              <strong>Application #{application.id}</strong>
              <div>Candidate user id: {application.candidate_user_id}</div>
              <div>Cover letter: {application.cover_letter || 'No cover letter'}</div>
              <div>CV: {application.cv_object_key ? 'Uploaded' : 'Not uploaded'}</div>
              <div>Status: {application.status}</div>
              <label style={{ display: 'block', marginTop: 8 }}>
                Change status
                <select
                  value={applicationStatusDraft[application.id] || application.status}
                  onChange={(event) => setApplicationStatusDraft((current) => ({ ...current, [application.id]: event.target.value }))}
                >
                  {APPLICATION_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => saveApplicationStatus(application.id)} style={{ marginTop: 6 }}>
                Save status
              </button>
            </li>
          ))}
        </ul>
      </section>

      {companyModalOpen && (
        <Modal onClose={() => setCompanyModalOpen(false)}>
          <CompanyForm onCancel={() => setCompanyModalOpen(false)} onSubmit={createCompany} />
        </Modal>
      )}

      {jobModalOpen && (
        <Modal onClose={() => setJobModalOpen(false)}>
          <JobForm
            companies={companies}
            draft={jobDraft}
            setDraft={setJobDraft}
            editing={editingJobId !== null}
            onCancel={() => setJobModalOpen(false)}
            onSubmit={saveJob}
          />
        </Modal>
      )}
    </div>
  )
}

function CompanyForm({ onCancel, onSubmit }){
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handle(event){
    event.preventDefault()
    setSubmitting(true)
    try{
      await onSubmit({
        name,
        website_url: website || null,
        location: location || null,
        description: description || null,
      })
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handle}>
      <h3>Create company</h3>
      <div>
        <label>Name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div>
        <label>Website</label>
        <input value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <div>
        <label>Location</label>
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" disabled={submitting} style={{ marginLeft: 8 }}>Create</button>
      </div>
    </form>
  )
}

function JobForm({ companies, draft, setDraft, editing, onCancel, onSubmit }){
  const companyOptions = companies.length > 0 ? companies : []

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
      <h3>{editing ? 'Edit job' : 'Create job'}</h3>
      {!editing && (
        <div>
          <label>Company</label>
          <select value={draft.company_id} onChange={(event) => setDraft((current) => ({ ...current, company_id: event.target.value }))} required>
            <option value="">Select company</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      )}
      {editing && (
        <div>
          <label>Company id</label>
          <input value={draft.company_id} disabled />
        </div>
      )}
      <div>
        <label>Title</label>
        <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} required />
      </div>
      <div>
        <label>Location</label>
        <input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
      </div>
      <div>
        <label>Employment type</label>
        <input value={draft.employment_type} onChange={(event) => setDraft((current) => ({ ...current, employment_type: event.target.value }))} />
      </div>
      <div>
        <label>Description</label>
        <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} required />
      </div>
      <div>
        <label>Tags</label>
        <input
          value={draft.tags}
          onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
          placeholder="comma-separated"
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" style={{ marginLeft: 8 }}>{editing ? 'Save' : 'Create'}</button>
      </div>
    </form>
  )
}