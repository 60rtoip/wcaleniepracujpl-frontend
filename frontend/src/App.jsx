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
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/jobs">Jobs</Link>
        {user && user.role === 'candidate' && <Link to="/candidate/applications">My applications</Link>}
        {user && user.role === 'recruiter' && <Link to="/recruiter">Recruiter dashboard</Link>}
        {user && user.role === 'admin' && <Link to="/admin">Admin dashboard</Link>}

        {user ? (
          <>
            <span className="user-chip" style={{marginLeft:12}}>
              {user.email}
              {roleLabel && <span className={`role-badge role-${user.role}`}>{roleLabel}</span>}
            </span>
            <button style={{marginLeft:8}} onClick={logout}>Logout</button>
            <Link to="/reports/new" style={{marginLeft:8}}>Report job</Link>
            {user?.role === 'admin' && <Link to="/admin/reports" style={{marginLeft:8}}>Reports</Link>}
            {user?.role === 'admin' && <Link to="/admin/updates" style={{marginLeft:8}}>Updates</Link>}
            {user?.role === 'admin' && <Link to="/admin/accounts" style={{marginLeft:8}}>Accounts</Link>}
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
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
