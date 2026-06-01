import React, { useState } from 'react'
import api from '../api/client'
import { parseApiError } from '../utils/errorFormatter'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const submit = async (e)=>{
    e.preventDefault()
    setMsg(null)
    setError(null)
    
    try{
      const data = await api.postJSON('/auth/register', { email, password })
      setMsg('Registered — user id: ' + (data?.id || 'unknown'))
    }catch(e){ 
      setError(parseApiError(e))
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={submit} className="form">
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button type="submit">Register</button>
      </form>
      {msg && <p style={{color: '#28a745'}}>{msg}</p>}
      {error && <p style={{color: '#dc3545'}}>{error}</p>}
    </div>
  )
}
