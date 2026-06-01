import React from 'react'
import { Link } from 'react-router-dom'
import { formatTimestamp, useActivityFeed } from '../utils/activityFeed'

const ACTIVITY_TITLES = {
  'application-submitted': 'Candidate application submitted',
  'job-approved': 'Job approved',
  'job-rejected': 'Job rejected',
  'report-resolved': 'Report resolved',
  'report-dismissed': 'Report dismissed',
  'account-created': 'Account created',
  'account-request': 'Account request queued',
  'recruiter-application-submitted': 'Recruiter application submitted',
  'recruiter-application-approved': 'Recruiter application approved',
  'recruiter-application-rejected': 'Recruiter application rejected',
}

function formatActivityTitle(activity){
  return ACTIVITY_TITLES[activity.type] || activity.title || 'Update'
}

export default function AdminUpdates({ currentUser, authReady }){
  const activities = useActivityFeed()

  if(!authReady) return <p>Checking session...</p>
  if(!currentUser) return <p>Please log in as admin to view updates.</p>
  if(currentUser.role !== 'admin') return <p>Insufficient permissions.</p>

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">Updates</h2>
          <p className="page-subtitle">
            A live activity stream for moderation notes, candidate actions, recruiter requests, and account changes.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button button-secondary" to="/admin">Admin overview</Link>
          <Link className="button" to="/admin/accounts">Accounts</Link>
        </div>
      </header>

      <section className="card">
        <h3>Activity feed</h3>
        {activities.length === 0 ? (
          <p className="muted">No updates yet. New applications, approvals, and admin notes will appear here.</p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {activities.map((activity) => (
              <article key={activity.id} style={{
                padding: '16px',
                background: '#f9f9f9',
                borderLeft: '4px solid #0066cc',
                borderRadius: '4px'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                  <div>
                    <p style={{margin: '0 0 4px 0', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      {activity.type.replaceAll('-', ' ')}
                    </p>
                    <h4 style={{margin: 0, fontSize: '1.1rem', color: '#222'}}>
                      {formatActivityTitle(activity)}
                    </h4>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: activity.status === 'live' ? '#e8f5e9' : '#fff3e0',
                    color: activity.status === 'live' ? '#2e7d32' : '#e65100'
                  }}>
                    {activity.status || 'live'}
                  </span>
                </div>
                <p style={{margin: '0 0 12px 0', fontSize: '0.95rem', color: '#555', lineHeight: '1.5'}}>
                  {activity.description || activity.note || 'No details were recorded.'}
                </p>
                {activity.note && (
                  <div style={{marginBottom: '12px', padding: '12px', background: '#f0f8ff', borderLeft: '3px solid #0066cc', borderRadius: '4px'}}>
                    <strong style={{color: '#0066cc'}}>Admin note</strong>
                    <p style={{margin: '8px 0 0 0', color: '#333'}}>{activity.note}</p>
                  </div>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key} style={{fontSize: '0.9rem'}}>
                        <dt style={{color: '#666', fontWeight: 600}}>{key.replaceAll('_', ' ')}</dt>
                        <dd style={{margin: 0, color: '#333'}}>{String(value)}</dd>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize: '0.85rem', color: '#999'}}>
                  {formatTimestamp(activity.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}