import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { appendActivity, formatTimestamp, hideReportLocally, useHiddenReportIds } from '../utils/activityFeed'

export default function ReportsManagement({currentUser, authReady}){
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const hiddenReportIds = useHiddenReportIds()

  useEffect(()=>{
    if(!authReady) return
    if(!currentUser || currentUser.role !== 'admin') return

    load()
  },[currentUser, authReady])

  async function load(){
    setLoading(true)
    setError(null)
    try{
      const data = await api.getJSON('/admin/reports')
      setReports(data)
    }catch(e){
      setError(e.payload || e.message || String(e))
    }finally{
      setLoading(false)
    }
  }

  async function resolveReport(id){
    try{
      await api.postJSON(`/admin/reports/${id}/resolve`, { note: null })
      appendActivity({
        type: 'report-resolved',
        status: 'completed',
        title: `Report #${id} resolved`,
        description: 'The report was marked as resolved from the admin reports page.',
        metadata: { report_id: id },
      })
      await load()
    }catch(e){ setError(e.payload || e.message || String(e)) }
  }

  async function dismissReport(id){
    try{
      await api.postJSON(`/admin/reports/${id}/dismiss`, { note: null })
      appendActivity({
        type: 'report-dismissed',
        status: 'completed',
        title: `Report #${id} dismissed`,
        description: 'The report was dismissed from the admin reports page.',
        metadata: { report_id: id },
      })
      await load()
    }catch(e){ setError(e.payload || e.message || String(e)) }
  }

  function deleteReport(reportId){
    hideReportLocally(reportId)
    appendActivity({
      type: 'report-hidden',
      status: 'completed',
      title: `Report #${reportId} removed from the admin view`,
      description: 'The report was hidden locally from the admin reports page.',
      metadata: { report_id: reportId },
    })
    setReports((current) => current.filter((report) => report.id !== reportId))
  }

  if(!authReady) return <p>Checking session...</p>
  if(!currentUser) return <p>Please log in as admin to view reports.</p>
  if(currentUser.role !== 'admin') return <p>Insufficient permissions.</p>

  const visibleReports = reports.filter((report) => !hiddenReportIds.has(report.id))

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-subtitle">Admin-only view with card-style report records, notes, and a local hide action for quick cleanup.</p>
        </div>
      </header>
      {loading && <p>Loading…</p>}
      {error && <p style={{color:'red'}}>{JSON.stringify(error)}</p>}
      {visibleReports.length === 0 && !loading && <p>No reports.</p>}
      <div className="record-grid">
        {visibleReports.map((report) => (
          <article key={report.id} className="record-card">
            <div className="record-card__header">
              <div>
                <p className="record-kicker">Report #{report.id}</p>
                <h4>Job #{report.job_id}</h4>
              </div>
              <button className="icon-button" type="button" onClick={() => deleteReport(report.id)} aria-label={`Remove report ${report.id}`}>
                ×
              </button>
            </div>
            <p className="record-summary">{report.reason}</p>
            <dl className="metadata-grid">
              <div>
                <dt>Reporter</dt>
                <dd>{report.reporter_user_id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{report.status}</dd>
              </div>
              {report.resolution_note && (
                <div>
                  <dt>Admin note</dt>
                  <dd>{report.resolution_note}</dd>
                </div>
              )}
            </dl>
            <div className="record-actions">
              <button className="button" onClick={()=>resolveReport(report.id)}>Resolve</button>
              <button className="button button-secondary" onClick={()=>dismissReport(report.id)}>Dismiss</button>
            </div>
            <div className="record-footer">{formatTimestamp(report.created_at)}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
