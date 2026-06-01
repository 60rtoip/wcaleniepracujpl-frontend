const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? ''
const API_PREFIX = '/api/v1'

const token = () => localStorage.getItem('access_token')

export const buildUrl = (path) => `${API_ORIGIN}${API_PREFIX}${path}`

async function request(path, opts = {}){
  const headers = { Accept: 'application/json', ...(opts.headers || {}) }
  if (opts.json !== false && opts.body && typeof opts.body === 'object') headers['Content-Type'] = 'application/json'
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const body = headers['Content-Type'] && typeof opts.body === 'object' ? JSON.stringify(opts.body) : opts.body
  const url = buildUrl(path)
  let res
  try{
    res = await fetch(url, { ...opts, headers, body })
  }catch(networkErr){
    const err = new Error(`Network error when calling ${url}: ${networkErr.message}`)
    err.original = networkErr
    throw err
  }

  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch(e){ data = text }

  if(!res.ok){
    const err = new Error(typeof data === 'string' ? data : (data && data.detail) || `HTTP ${res.status}`)
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

export default {
  get(path){ return request(path) },
  getJSON(path){ return request(path) },
  postJSON(path, body){ return request(path, { method: 'POST', body }) },
  putJSON(path, body){ return request(path, { method: 'PUT', body }) },
  patchJSON(path, body){ return request(path, { method: 'PATCH', body }) },
  deleteJSON(path){ return request(path, { method: 'DELETE' }) },
}
