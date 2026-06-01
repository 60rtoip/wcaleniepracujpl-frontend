import React, { useMemo, useState } from 'react'
import api from '../api/client'
import { appendActivity, formatTimestamp, updateActivity, useActivityFeed } from '../utils/activityFeed'

function normalizeError(error){
  return error?.payload?.detail || error?.payload || error?.message || String(error)
}

export default function AdminAccounts({ currentUser, authReady }){
  const activities = useActivityFeed()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('candidate')
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState({})

  const canUseRoleRegistration = import.meta.env.DEV

  const recruiterApplications = useMemo(
    () => activities.filter((activity) => activity.type === 'recruiter-application-submitted' && activity.status === 'pending'),
    [activities],
  )

  if(!authReady) return <p>Checking session...</p>
  if(!currentUser) return <p>Please log in as admin to manage accounts.</p>
  if(currentUser.role !== 'admin') return <p>Insufficient permissions.</p>

  async function createAccount(event){
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try{
      if(role !== 'candidate' && !canUseRoleRegistration){
        appendActivity({
          type: 'account-request',
          status: 'pending',
          title: `${role} account request queued locally`,
          description: `Requested account for ${email}. Backend role-specific registration is only available in development.`,
          note: `Full name: ${fullName || 'n/a'}`,
          metadata: { email, role },
        })
        setFeedback('Role-specific account creation is only available in development, so the request was queued locally.')
        return
      }

      const endpoint = role === 'candidate' ? '/auth/register' : '/auth/register-test'
      const payload = {
        email,
        password,
        full_name: fullName || null,
      }
      if(endpoint === '/auth/register-test'){
        payload.role = role
      }

      const createdUser = await api.postJSON(endpoint, payload)
      appendActivity({
        type: 'account-created',
        status: 'completed',
        title: `${createdUser.role} account created`,
        description: `Created account for ${createdUser.email}.`,
        metadata: {
          user_id: createdUser.id,
          role: createdUser.role,
        },
      })
      setFeedback(`Created ${createdUser.role} account for ${createdUser.email}.`)
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('candidate')
    }catch(error){
      setFeedback(normalizeError(error))
    }finally{
      setSubmitting(false)
    }
  }

  async function approveRecruiterApplication(application){
    const reviewNote = reviewNotes[application.id] || ''
    updateActivity(application.id, {
      status: 'approved',
      note: reviewNote || application.note || null,
      reviewed_by: currentUser.email,
      reviewed_at: new Date().toISOString(),
    })
    appendActivity({
      type: 'recruiter-application-approved',
      status: 'completed',
      title: `${application.title || 'Recruiter application'} approved`,
      description: application.description,
      note: reviewNote || 'Approved from the admin account page.',
      metadata: application.metadata || {},
    })
    setReviewNotes((current) => ({ ...current, [application.id]: '' }))
  }

  async function rejectRecruiterApplication(application){
    const reviewNote = reviewNotes[application.id] || ''
    updateActivity(application.id, {
      status: 'rejected',
      note: reviewNote || application.note || null,
      reviewed_by: currentUser.email,
      reviewed_at: new Date().toISOString(),
    })
    appendActivity({
      type: 'recruiter-application-rejected',
      status: 'completed',
      title: `${application.title || 'Recruiter application'} rejected`,
      description: application.description,
      note: reviewNote || 'Rejected from the admin account page.',
      metadata: application.metadata || {},
    })
    setReviewNotes((current) => ({ ...current, [application.id]: '' }))
  }

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">Accounts</h2>
          <p className="page-subtitle">
            Create new users and review recruiter applications from one place.
          </p>
        </div>
      </header>

      <div className="section-grid">
        <section className="card">
          <h3>Create account</h3>
          <form className="stack-form" onSubmit={createAccount}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Full name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} />
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {!canUseRoleRegistration && (
              <p className="muted">Role-specific account creation is limited to development mode. Candidate accounts still use the normal registration endpoint.</p>
            )}
            <button className="button" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create account'}</button>
            {feedback && <p className="feedback">{feedback}</p>}
          </form>
        </section>

        <section className="card">
          <h3>Recruiter applications</h3>
          {recruiterApplications.length === 0 ? (
            <p className="muted">No pending recruiter applications right now.</p>
          ) : (
            <div className="record-grid">
              {recruiterApplications.map((application) => (
                <article className="record-card" key={application.id}>
                  <div className="record-card__header">
                    <div>
                      <p className="record-kicker">Pending review</p>
                      <h4>{application.title}</h4>
                    </div>
                    <span className="status-pill status-pill--pending">pending</span>
                  </div>
                  <p className="record-summary">{application.description}</p>
                  {application.note && <div className="note-box"><strong>Applicant note</strong><p>{application.note}</p></div>}
                  {application.metadata && Object.keys(application.metadata).length > 0 && (
                    <dl className="metadata-grid">
                      {Object.entries(application.metadata).map(([key, value]) => (
                        <div key={key}>
                          <dt>{key.replaceAll('_', ' ')}</dt>
                          <dd>{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <label className="stack-field">
                    Admin note
                    <textarea
                      value={reviewNotes[application.id] || ''}
                      onChange={(event) => setReviewNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                      rows="3"
                    />
                  </label>
                  <div className="record-actions">
                    <button className="button" type="button" onClick={() => approveRecruiterApplication(application)}>Approve</button>
                    <button className="button button-danger" type="button" onClick={() => rejectRecruiterApplication(application)}>Reject</button>
                  </div>
                  <div className="record-footer">{formatTimestamp(application.createdAt)}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}