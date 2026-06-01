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
          <div className="record-grid">
            {activities.map((activity) => (
              <article className="record-card" key={activity.id}>
                <div className="record-card__header">
                  <div>
                    <p className="record-kicker">{activity.type.replaceAll('-', ' ')}</p>
                    <h4>{formatActivityTitle(activity)}</h4>
                  </div>
                  <span className={`status-pill status-pill--${activity.status || 'live'}`}>
                    {activity.status || 'live'}
                  </span>
                </div>
                <p className="record-summary">{activity.description || activity.note || 'No details were recorded.'}</p>
                {activity.note && (
                  <div className="note-box">
                    <strong>Admin note</strong>
                    <p>{activity.note}</p>
                  </div>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <dl className="metadata-grid">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key.replaceAll('_', ' ')}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="record-footer">{formatTimestamp(activity.createdAt)}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}