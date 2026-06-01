import { useEffect, useState } from 'react'

const ACTIVITY_STORAGE_KEY = 'wcalenie-activity-feed-v1'
const HIDDEN_REPORT_STORAGE_KEY = 'wcalenie-hidden-report-ids-v1'
const ACTIVITY_EVENT_NAME = 'wcalenie-activity-feed-updated'
const HIDDEN_REPORT_EVENT_NAME = 'wcalenie-hidden-report-ids-updated'

function makeId(){
  if(typeof crypto !== 'undefined' && crypto.randomUUID){
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readJson(key, fallback){
  try{
    const raw = localStorage.getItem(key)
    if(!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  }catch{
    return fallback
  }
}

function writeJson(key, value, eventName){
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(eventName))
}

export function formatTimestamp(value){
  if(!value) return 'just now'
  const date = new Date(value)
  if(Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function readActivityFeed(){
  return readJson(ACTIVITY_STORAGE_KEY, [])
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function appendActivity(entry){
  const item = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    status: 'live',
    ...entry,
  }
  const next = [item, ...readActivityFeed()]
  writeJson(ACTIVITY_STORAGE_KEY, next, ACTIVITY_EVENT_NAME)
  return item
}

export function updateActivity(activityId, updater){
  const next = readActivityFeed().map((item) => {
    if(item.id !== activityId) return item
    const patch = typeof updater === 'function' ? updater(item) : updater
    return { ...item, ...patch }
  })
  writeJson(ACTIVITY_STORAGE_KEY, next, ACTIVITY_EVENT_NAME)
  return next.find((item) => item.id === activityId) || null
}

export function useActivityFeed(){
  const [activities, setActivities] = useState(() => readActivityFeed())

  useEffect(() => {
    const sync = () => setActivities(readActivityFeed())
    window.addEventListener(ACTIVITY_EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ACTIVITY_EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return activities
}

export function readHiddenReportIds(){
  return new Set(readJson(HIDDEN_REPORT_STORAGE_KEY, []))
}

export function hideReportLocally(reportId){
  const next = Array.from(new Set([...readHiddenReportIds(), reportId]))
  writeJson(HIDDEN_REPORT_STORAGE_KEY, next, HIDDEN_REPORT_EVENT_NAME)
}

export function useHiddenReportIds(){
  const [hiddenReportIds, setHiddenReportIds] = useState(() => readHiddenReportIds())

  useEffect(() => {
    const sync = () => setHiddenReportIds(readHiddenReportIds())
    window.addEventListener(HIDDEN_REPORT_EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(HIDDEN_REPORT_EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return hiddenReportIds
}