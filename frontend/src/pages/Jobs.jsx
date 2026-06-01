import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Jobs({currentUser, authReady}){
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    if(!authReady) return

    async function load(){
      setLoading(true)
      setError(null)
      try{
        // Always load public jobs, no recruiter scope
        const data = await api.getJSON('/jobs')
        setJobs(data)
      }catch(e){
        setError(e.payload || e.message || String(e))
      }finally{
        setLoading(false)
      }
    }

    load()
  },[authReady])

  if(loading) return <p>Loading jobs…</p>
  if(error) return <p>Error: {error}</p>

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">Available Positions</h2>
          <p className="page-subtitle">
            Explore approved job opportunities and apply to positions that match your profile.
          </p>
        </div>
      </header>

      {jobs.length === 0 ? (
        <p style={{textAlign: 'center', marginTop: 40}}>No jobs available at the moment.</p>
      ) : (
        <div className="jobs-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          marginTop: 24
        }}>
          {jobs.map(job => (
            <article key={job.id} className="job-card" style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
            >
              <h3 style={{margin: '0 0 8px 0', fontSize: '1.25rem', color: '#222'}}>
                {job.title}
              </h3>
              <p style={{margin: '0 0 4px 0', color: '#999', fontSize: '0.85rem'}}>
                Job ID: {job.id}
              </p>
              <p style={{margin: '0 0 16px 0', color: '#666', fontSize: '0.95rem'}}>
                {job.location || 'Remote'}
              </p>
              
              {job.employment_type && (
                <p style={{margin: '0 0 12px 0', padding: '6px 12px', background: '#f0f0f0', borderRadius: '4px', fontSize: '0.9rem', width: 'fit-content'}}>
                  {job.employment_type}
                </p>
              )}
              
              <p style={{
                margin: '0 0 16px 0',
                color: '#555',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                flex: 1
              }}>
                {job.description.substring(0, 150)}...
              </p>

              {job.tags && job.tags.length > 0 && (
                <div style={{
                  marginBottom: 16,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {job.tags.slice(0, 4).map(tag => (
                    <span key={tag} style={{
                      background: '#e8f0ff',
                      color: '#0066cc',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button 
                className="button"
                onClick={() => navigate(`/candidate/applications?jobId=${job.id}`)}
                style={{marginTop: 'auto'}}
              >
                Apply Now
              </button>
            </article>
          ))}
        </div>
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
