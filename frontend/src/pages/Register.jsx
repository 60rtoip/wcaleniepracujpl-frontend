import React, { useState } from 'react'
import api from '../api/client'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = async (e)=>{
    e.preventDefault()
    setMsg(null)
    try{
      const data = await api.postJSON('/auth/register', { email, password })
      setMsg('Registered — user id: ' + (data?.id || 'unknown'))
    }catch(e){ setMsg('Error: '+ e.message) }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={submit} className="form">
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
