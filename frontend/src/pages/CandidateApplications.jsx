import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import Modal from '../components/Modal'
import { appendActivity, formatTimestamp } from '../utils/activityFeed'

function proxiedPresignedUrl(url){
  if(!import.meta.env.DEV) return url
  const parsed = new URL(url)
  return `${window.location.origin}/minio${parsed.pathname}${parsed.search}`
}

export default function CandidateApplications({ currentUser }){
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState(searchParams.get('jobId') || '')
  const [coverLetter, setCoverLetter] = useState('')
  const [file, setFile] = useState(null)
  const [history, setHistory] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [recruiterName, setRecruiterName] = useState('')
  const [recruiterCompany, setRecruiterCompany] = useState('')
  const [recruiterMotivation, setRecruiterMotivation] = useState('')
  const [recruiterMessage, setRecruiterMessage] = useState(null)

  // Protect route: only candidates can access
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
    } else if (currentUser.role !== 'candidate') {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  async function fetchMyApps(){
    setLoading(true)
    try{
      const data = await client.getJSON('/applications/me')
      setApplications(data || [])
    }catch(err){
      console.error('fetchMyApps', err)
      setApplications([])
    }finally{ setLoading(false) }
  }

  useEffect(() => { fetchMyApps() }, [])

  async function presignAndUpload(file){
    try{
      const resp = await client.postJSON('/applications/cv-presign', { filename: file.name })
      const uploadUrl = proxiedPresignedUrl(resp.upload_url)
      // upload to presigned URL
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } })
      return resp.object_key
    }catch(err){
      console.error('presignAndUpload failed', err)
      throw err
    }
  }

  async function handleApply(e){
    e.preventDefault()
    try{
      if(!jobId.trim()) throw new Error('Job ID is required.')
      let objectKey = null
      if(file){
        objectKey = await presignAndUpload(file)
      }
      const payload = { job_id: Number(jobId) }
      if(coverLetter) payload.cover_letter = coverLetter
      if(objectKey) payload.cv_object_key = objectKey
      const createdApplication = await client.postJSON('/applications', payload)
      appendActivity({
        type: 'application-submitted',
        status: 'live',
        title: `Application submitted for job #${jobId}`,
        description: coverLetter || 'A candidate application was submitted.',
        note: coverLetter || null,
        metadata: {
          application_id: createdApplication?.id || 'n/a',
          job_id: Number(jobId),
          cv_uploaded: Boolean(objectKey),
        },
      })
      setJobId('')
      setCoverLetter('')
      setFile(null)
      fetchMyApps()
      alert('Applied successfully')
    }catch(err){
      console.error('apply', err)
      const message = err?.message || err?.payload?.detail || JSON.stringify(err)
      alert('Apply failed: ' + message)
    }
  }

  function handleRecruiterApplication(event){
    event.preventDefault()
    appendActivity({
      type: 'recruiter-application-submitted',
      status: 'pending',
      title: `${recruiterName || currentUser?.full_name || currentUser?.email || 'Candidate'} requested recruiter access`,
      description: recruiterMotivation || 'No motivation was provided.',
      note: recruiterMotivation || null,
      metadata: {
        candidate_email: currentUser?.email || 'n/a',
        company: recruiterCompany || 'n/a',
      },
    })
    setRecruiterMessage('Recruiter application saved to the admin review queue.')
    setRecruiterName('')
    setRecruiterCompany('')
    setRecruiterMotivation('')
  }

  async function handleHistory(applicationId){
    try{
      const events = await client.getJSON(`/applications/${applicationId}/history`)
      setHistory(events)
      setHistoryOpen(true)
    }catch(err){
      console.error('history', err)
      alert('Failed to fetch history')
    }
  }

  async function handleCvDownload(application){
    try{
      const resp = await client.get(`/applications/${application.id}/cv-download`)
      // resp.download_url
      window.open(proxiedPresignedUrl(resp.download_url), '_blank')
    }catch(err){
      console.error('cv-download', err)
      alert('No CV available or download failed')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">My applications</h2>
          <p className="page-subtitle">Track your submitted jobs and send a separate recruiter application request from the same page.</p>
        </div>
      </header>

      <div className="section-grid">
        <section className="card">
          <h3>Apply to a job</h3>
          <form onSubmit={handleApply} className="stack-form">
            <label>
              Job ID
              <input value={jobId} onChange={(event) => setJobId(event.target.value)} required />
            </label>
            <label>
              Cover letter
              <textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows="6" placeholder="Write your cover letter here..." />
            </label>
            <label>
              CV file
              <input type="file" onChange={(event) => setFile(event.target.files[0])} />
            </label>
            <button className="button" type="submit">Apply</button>
          </form>
        </section>

        <section className="card">
          <h3>Recruiter application</h3>
          <p className="muted">Use this separate section if you want to request recruiter access.</p>
          <form onSubmit={handleRecruiterApplication} className="stack-form">
            <label>
              Display name
              <input value={recruiterName} onChange={(event) => setRecruiterName(event.target.value)} placeholder={currentUser?.full_name || currentUser?.email || 'Your name'} />
            </label>
            <label>
              Company or team
              <input value={recruiterCompany} onChange={(event) => setRecruiterCompany(event.target.value)} />
            </label>
            <label>
              Why should this account become a recruiter?
              <textarea value={recruiterMotivation} onChange={(event) => setRecruiterMotivation(event.target.value)} rows="4" />
            </label>
            <button className="button" type="submit">Submit recruiter application</button>
            {recruiterMessage && <p className="feedback">{recruiterMessage}</p>}
          </form>
        </section>
      </div>

      <section className="card">
        <h3>Your submitted applications</h3>
        {loading ? <p>Loading...</p> : (
          <div className="record-grid">
            {applications.map((application) => (
              <article className="record-card" key={application.id}>
                <div className="record-card__header">
                  <div>
                    <p className="record-kicker">Application #{application.id}</p>
                    <h4>Job #{application.job_id}</h4>
                  </div>
                  <span className={`status-pill status-pill--${String(application.status).replaceAll(' ', '-')}`}>{String(application.status)}</span>
                </div>
                <p className="record-summary">{application.cover_letter || 'No cover letter was provided.'}</p>
                <dl className="metadata-grid">
                  <div>
                    <dt>CV</dt>
                    <dd>{application.cv_object_key ? 'Uploaded' : 'Not uploaded'}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{String(application.status)}</dd>
                  </div>
                </dl>
                <div className="record-actions">
                  <button className="button button-secondary" onClick={() => handleHistory(application.id)}>History</button>
                  {application.cv_object_key && <button className="button" onClick={() => handleCvDownload(application)}>Download CV</button>}
                </div>
                <div className="record-footer">{formatTimestamp(application.created_at)}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      {historyOpen && (
        <Modal onClose={() => { setHistoryOpen(false); setHistory(null); }}>
          <h3>Application History</h3>
          {history ? (
            <div className="record-grid">
              {history.map((event) => (
                <article className="record-card" key={event.id}>
                  <p className="record-kicker">{formatTimestamp(event.created_at)}</p>
                  <h4>{event.from_status} → {event.to_status}</h4>
                  <p className="record-summary">{event.note || 'No note was attached.'}</p>
                </article>
              ))}
            </div>
          ) : <p>No history</p>}
        </Modal>
      )}
    </div>
  )
}
