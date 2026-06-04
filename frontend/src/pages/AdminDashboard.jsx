import React from 'react'
import { Link } from 'react-router-dom'
import { useActivityFeed } from '../utils/activityFeed'

export default function AdminDashboard({ currentUser, authReady }){
  const activities = useActivityFeed()

  if(!authReady) return <p>Checking session...</p>
  if(!currentUser) return <p>Please log in as admin to access this page.</p>
  if(currentUser.role !== 'admin') return <p>Insufficient permissions.</p>

  const recentActivities = activities.slice(0, 4)

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">Admin dashboard</h2>
          <p className="page-subtitle">
            Manage reports, view live updates, create accounts, and review recruiter requests from a calmer overview screen.
          </p>
        </div>
      </header>

      <section className="section-grid">
        <article className="card">
          <h3>Reports</h3>
          <p className="muted">Review reports in card form and remove them with the close button when they no longer need attention.</p>
          <Link className="button" to="/admin/reports">Open reports</Link>
        </article>
        <article className="card">
          <h3>Updates</h3>
          <p className="muted">Follow application activity, admin notes, recruiter requests, and account events.</p>
          <Link className="button" to="/admin/updates">Open updates</Link>
        </article>
        <article className="card">
          <h3>Accounts</h3>
          <p className="muted">Create new accounts and approve recruiter applications from one screen.</p>
          <Link className="button" to="/admin/accounts">Open accounts</Link>
        </article>
      </section>

      <section className="card">
        <h3>Recent activity</h3>
        {recentActivities.length === 0 ? (
          <p className="muted">Nothing has been recorded yet. Activity will appear here as the UI is used.</p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {recentActivities.slice(0, 3).map((activity) => (
              <article key={activity.id} style={{
                padding: '16px',
                background: '#f9f9f9',
                borderLeft: '4px solid #0066cc',
                borderRadius: '4px'
              }}>
                <p style={{margin: '0 0 4px 0', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  {activity.type.replaceAll('-', ' ')}
                </p>
                <h4 style={{margin: '4px 0'}}>
                  {activity.title || 'Update'}
                </h4>
                <p style={{margin: 0, fontSize: '0.95rem', color: '#555'}}>
                  {activity.description || activity.note || 'No details were recorded.'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}