import React, { useEffect, useState } from 'react'
import api from '../api/client'
import Modal from '../components/Modal'

export default function Companies({currentUser, authReady}){
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(()=>{
    if(!authReady) return

    if(!currentUser || currentUser.role !== 'recruiter'){
      setCompanies([])
      setError(null)
      return
    }

    api.getJSON('/companies')
      .then(data => {
        setCompanies(data)
        setError(null)
      })
      .catch(e => {
        setError(e.payload || e.message || String(e))
        setCompanies([])
      })
  }, [currentUser, authReady])

  async function submitCompany(payload){
    try{
      await api.postJSON('/companies', payload)
      const data = await api.getJSON('/companies')
      setCompanies(data)
      setShowModal(false)
      setError(null)
    }catch(e){
      setError(e.payload || e.message || String(e))
    }
  }

  const role = currentUser?.role || 'guest'

  return (
    <div>
      <h2>My companies</h2>

      {role === 'recruiter' && (
        <>
          <p>Manage companies that you own.</p>
          <button onClick={()=>setShowModal(true)}>Add company</button>

          {error && <p>Error: {JSON.stringify(error)}</p>}
          <ul>
            {companies.map(c=> (
              <li key={c.id}><strong>{c.name}</strong> — {c.website_url || 'no website'}</li>
            ))}
          </ul>

          {showModal && (
            <Modal onClose={()=>setShowModal(false)}>
              <CompanyForm onCancel={()=>setShowModal(false)} onSubmit={submitCompany} />
            </Modal>
          )}
        </>
      )}

      {authReady && role === 'guest' && (
        <p>Please log in as a recruiter to access company management.</p>
      )}
      {authReady && role === 'candidate' && (
        <p>Candidate accounts cannot access company management.</p>
      )}
      {authReady && role === 'admin' && (
        <p>Admin accounts do not manage recruiter companies here.</p>
      )}
    </div>
  )
}

function CompanyForm({onCancel,onSubmit}){
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handle(e){
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      name,
      website_url: website || null,
      location: location || null,
      description: description || null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handle}>
      <h3>New Company</h3>
      <div>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} required />
      </div>
      <div>
        <label>Website</label>
        <input value={website} onChange={e=>setWebsite(e.target.value)} />
      </div>
      <div>
        <label>Location</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div style={{marginTop:8}}>
        <button type="button" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" disabled={submitting} style={{marginLeft:8}}>Create</button>
      </div>
    </form>
  )
}
