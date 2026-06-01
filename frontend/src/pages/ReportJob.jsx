import React, { useState } from 'react'
import api from '../api/client'

export default function ReportJob({currentUser, authReady}){
  const [jobId, setJobId] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  if(!authReady) return <p>Checking session...</p>
  if(!currentUser) return <p>Please log in to submit a report.</p>

  async function submit(e){
    e.preventDefault()
    setMsg(null)
    setError(null)
    try{
      await api.postJSON(`/admin/reports/jobs/${jobId}`, { reason })
      setMsg('Report submitted successfully.')
      setJobId('')
      setReason('')
    }catch(e){
      setError(e.payload || e.message || String(e))
    }
  }

  return (
    <div>
      <h2>Report a Job</h2>
      <p>Use this form to report a job for review. Any authenticated user may submit a report.</p>
      <form onSubmit={submit} className="form">
        <label>Job ID<input value={jobId} onChange={e=>setJobId(e.target.value)} type="number" required /></label>
        <label>Reason<textarea value={reason} onChange={e=>setReason(e.target.value)} required /></label>
        <div>
          <button type="submit">Submit report</button>
        </div>
      </form>
      {msg && <p style={{color:'green'}}>{msg}</p>}
      {error && <p style={{color:'red'}}>{JSON.stringify(error)}</p>}
    </div>
  )
}
