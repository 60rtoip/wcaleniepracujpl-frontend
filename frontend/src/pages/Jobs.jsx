import React, { useEffect, useState } from 'react'
import api from '../api/client'
import Modal from '../components/Modal'

export default function Jobs({currentUser, authReady}){
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(()=>{
    if(!authReady) return

    async function load(){
      setLoading(true)
      setError(null)
      try{
        const endpoint = currentUser?.role === 'recruiter' ? '/jobs/me' : '/jobs'
        const data = await api.getJSON(endpoint)
        setJobs(data)
      }catch(e){
        setError(e.payload || e.message || String(e))
      }finally{
        setLoading(false)
      }
    }

    load()
  },[currentUser, authReady])

  if(loading) return <p>Loading jobs…</p>
  if(error) return <p>Error: {error}</p>

  const role = currentUser?.role || 'guest'

  const headerText = {
    guest: 'Public jobs',
    candidate: 'Public jobs',
    recruiter: 'My jobs',
    admin: 'Public jobs',
  }[role]

  return (
    <div>
      <h2>{headerText}</h2>
      {(role === 'guest' || role === 'candidate') && (
        <p>Showing approved jobs only.</p>
      )}
      {role === 'recruiter' && (
        <p>You are viewing your recruiter scope (including pending moderation jobs).</p>
      )}
      {role === 'recruiter' && <button onClick={()=>setShowModal(true)}>Add job</button>}
      {jobs.length === 0 && <p>No jobs found (or backend not running).</p>}
      <ul>
        {jobs.map(job=> {
          const isTerminated = job.moderation_status === 'terminated'
          return (
            <li key={job.id} style={isTerminated ? {background:'#ffecec', padding:8, borderRadius:4} : {}}>
              <strong>{job.title}</strong> — {job.location || 'location N/A'}
              <div>Job id: {job.id} | Company id: {job.company_id} | Status: {job.moderation_status}</div>
              <div>Tags: {job.tags?.join(', ')}</div>
            </li>
          )
        })}
      </ul>

      {role === 'admin' && <AdminModerationPanel />}

      {showModal && (
        <Modal onClose={()=>setShowModal(false)}>
          <JobForm
            onCancel={()=>setShowModal(false)}
            onCreated={async ()=>{
              const data = await api.getJSON('/jobs/me')
              setJobs(data)
              setShowModal(false)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function AdminModerationPanel(){
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function loadQueue(){
    setLoading(true)
    setError(null)
    try{
      const data = await api.getJSON('/admin/moderation/jobs')
      setQueue(data)
    }catch(e){
      setError(e.payload || e.message || String(e))
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ loadQueue() },[])

  async function moderate(jobId, decision){
    try{
      await api.postJSON(`/admin/moderation/jobs/${jobId}/${decision}`, { note: null })
      await loadQueue()
    }catch(e){
      setError(e.payload || e.message || String(e))
    }
  }

  return (
    <section className="role-panel" style={{marginTop:16}}>
      <h3>Moderation queue</h3>
      <p>Only admin accounts can approve or reject pending jobs.</p>
      {loading && <p>Loading moderation queue…</p>}
      {error && <p>Error: {JSON.stringify(error)}</p>}
      {queue.length === 0 && !loading && <p>No pending jobs.</p>}
      <ul>
        {queue.map(job => (
          <li key={job.id}>
            <strong>{job.title}</strong> (#{job.id})
            <div>Job id: {job.id}</div>
            <div>Company id: {job.company_id}</div>
            <div>Status: {job.moderation_status}</div>
            <div style={{marginTop:6}}>
              <button type="button" onClick={()=>moderate(job.id, 'approve')}>Approve</button>
              <button type="button" style={{marginLeft:8}} onClick={()=>moderate(job.id, 'reject')}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
function JobForm({onCancel,onCreated}){
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [error, setError] = useState(null)

  useEffect(()=>{
    api.getJSON('/companies').then(data=>setCompanies(data)).catch(()=>setCompanies([]))
  },[])

  function addTag(){
    const t = tagInput.trim()
    if(t && !tags.includes(t)) setTags([...tags,t])
    setTagInput('')
  }

  async function submit(e){
    e.preventDefault()
    try{
      await api.postJSON('/jobs', {
        company_id: parseInt(companyId,10),
        title,
        location: location || null,
        employment_type: employmentType || null,
        description,
        tags,
      })
      await onCreated()
    }catch(err){
      setError(err.payload || err.message || String(err))
    }
  }

  return (
    <form onSubmit={submit}>
      <h3>New Job</h3>
      <div>
        <label>Company</label>
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)} required>
          <option value="">Select company</option>
          {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label>Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} required />
      </div>
      <div>
        <label>Tags</label>
        <div>
          <input value={tagInput} onChange={e=>setTagInput(e.target.value)} />
          <button type="button" onClick={addTag}>Add tag</button>
        </div>
        <div>{tags.map(t=> <span key={t} style={{padding:4,margin:4,border:'1px solid #ccc'}}>{t} <button type="button" onClick={()=>setTags(tags.filter(x=>x!==t))}>x</button></span>)}</div>
      </div>
      {error && <div style={{color:'red'}}>{JSON.stringify(error)}</div>}
      <div style={{marginTop:8}}>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" style={{marginLeft:8}}>Create</button>
      </div>
    </form>
  )
}
