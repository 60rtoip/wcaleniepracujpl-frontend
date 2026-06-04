import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import Companies from './pages/Companies'
import ReportJob from './pages/ReportJob'
import CandidateApplications from './pages/CandidateApplications'
import RecruiterDashboard from './pages/RecruiterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUpdates from './pages/AdminUpdates'
import AdminAccounts from './pages/AdminAccounts'
import ReportsManagement from './pages/ReportsManagement'
import Login from './pages/Login'
import Register from './pages/Register'
import client from './api/client'

export default function App(){
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const navigate = useNavigate()

  async function refreshCurrentUser(){
    const token = localStorage.getItem('access_token')
    if(!token){
      setUser(null)
      setAuthReady(true)
      return null
    }

    try{
      const me = await client.getJSON('/users/me')
      setUser(me)
      setAuthReady(true)
      return me
    }catch{
      localStorage.removeItem('access_token')
      setUser(null)
      setAuthReady(true)
      return null
    }
  }

  useEffect(() => {
    refreshCurrentUser()
  }, [])

  const roleLabel = user?.role ? user.role.toUpperCase() : null

  function logout(){
    localStorage.removeItem('access_token')
    setUser(null)
    navigate('/login')
  }

  return (
    <div>
      <nav className="nav" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e0e0e0'}}>
        <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
          <Link to="/" style={{fontWeight: 600, textDecoration: 'none', color: '#222'}}>Home</Link>
          <Link to="/jobs" style={{textDecoration: 'none', color: '#0066cc'}}>Jobs</Link>
          {user && user.role === 'candidate' && <Link to="/candidate/applications" style={{textDecoration: 'none', color: '#0066cc'}}>My applications</Link>}
          {user && user.role === 'recruiter' && <Link to="/recruiter" style={{textDecoration: 'none', color: '#0066cc'}}>Recruiter dashboard</Link>}
          {user && user.role === 'admin' && <Link to="/admin" style={{textDecoration: 'none', color: '#0066cc'}}>Admin dashboard</Link>}
          {user && <Link to="/reports/new" style={{textDecoration: 'none', color: '#0066cc'}}>Report job</Link>}
          {user?.role === 'admin' && <Link to="/admin/reports" style={{textDecoration: 'none', color: '#0066cc'}}>Reports</Link>}
          {user?.role === 'admin' && <Link to="/admin/updates" style={{textDecoration: 'none', color: '#0066cc'}}>Updates</Link>}
          {user?.role === 'admin' && <Link to="/admin/accounts" style={{textDecoration: 'none', color: '#0066cc'}}>Accounts</Link>}
        </div>

        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          {user ? (
            <>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '0.9rem', color: '#666'}}>{user.email}</span>
                {roleLabel && <span className={`role-badge role-${user.role}`} style={{padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600}}>{roleLabel}</span>}
              </div>
              <button onClick={logout} style={{padding: '8px 16px', background: '#123246', border: '1px solid #d0d0d0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem'}}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{textDecoration: 'none', color: '#0066cc'}}>Login</Link>
              <Link to="/register" style={{textDecoration: 'none', color: '#0066cc'}}>Register</Link>
            </>
          )}
        </div>
      </nav>
      <main className="container">
        {!authReady ? (
          <p>Checking session...</p>
        ) : (
          <Routes>
            <Route path="/" element={<Home user={user}/>} />
            <Route path="/jobs" element={<Jobs currentUser={user} authReady={authReady}/>} />
            <Route path="/candidate/applications" element={<CandidateApplications currentUser={user}/>} />
            <Route path="/recruiter" element={<RecruiterDashboard currentUser={user} authReady={authReady}/>} />
            <Route path="/companies" element={<Companies currentUser={user} authReady={authReady}/>} />
            <Route path="/login" element={<Login onLoginSuccess={refreshCurrentUser}/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/reports/new" element={<ReportJob currentUser={user} authReady={authReady}/>} />
            <Route path="/admin" element={<AdminDashboard currentUser={user} authReady={authReady}/>} />
            <Route path="/admin/reports" element={<ReportsManagement currentUser={user} authReady={authReady}/>} />
            <Route path="/admin/updates" element={<AdminUpdates currentUser={user} authReady={authReady}/>} />
            <Route path="/admin/accounts" element={<AdminAccounts currentUser={user} authReady={authReady}/>} />
          </Routes>
        )}
      </main>
    </div>
  )
}
