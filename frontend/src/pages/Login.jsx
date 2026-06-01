import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { parseApiError } from '../utils/errorFormatter'

export default function Login({onLoginSuccess}){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    setMsg(null)
    setError(null)
    
    try{
      const data = await api.postJSON('/auth/login', { email, password })
      localStorage.setItem('access_token', data.access_token)
      if(onLoginSuccess) await onLoginSuccess()
      setMsg('Logged in successfully.')
      navigate('/')
    }catch(e){ 
      setError(parseApiError(e))
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={submit} className="form">
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button type="submit">Login</button>
      </form>
      {msg && <p style={{color: '#28a745'}}>{msg}</p>}
      {error && <p style={{color: '#dc3545'}}>{error}</p>}
    </div>
  )
}
