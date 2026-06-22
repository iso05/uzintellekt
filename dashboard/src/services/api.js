// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.uzintellekt.uz'

// ── Cookie helpers ───────────────────────────────────────────────
function _cookieDomain() {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return null
  const parts = host.split('.')
  return parts.length >= 2 ? '.' + parts.slice(-2).join('.') : null
}
function _writeCookie(name, value, maxAge) {
  const domain = _cookieDomain()
  let c = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  if (domain) c += `; Domain=${domain}`
  if (window.location.protocol === 'https:') c += '; Secure'
  document.cookie = c
}
function _readCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}
function _deleteCookie(name) {
  const domain = _cookieDomain()
  let c = `${name}=; Path=/; Max-Age=0`
  if (domain) c += `; Domain=${domain}`
  document.cookie = c
}

// ── tokenStorage ─────────────────────────────────────────────────
export const tokenStorage = {
  get: () => {
    const ls = localStorage.getItem('access_token')
    if (ls) return ls
    const ck = _readCookie('access_token')
    if (ck) { localStorage.setItem('access_token', ck); return ck }
    return null
  },
  set: (t) => {
    localStorage.setItem('access_token', t)
    _writeCookie('access_token', t, 3600)
  },
  getRefresh: () => {
    const ls = localStorage.getItem('refresh_token')
    if (ls) return ls
    const ck = _readCookie('refresh_token')
    if (ck) { localStorage.setItem('refresh_token', ck); return ck }
    return null
  },
  setRefresh: (t) => {
    localStorage.setItem('refresh_token', t)
    _writeCookie('refresh_token', t, 86400)
  },
  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.clear()
    _deleteCookie('access_token')
    _deleteCookie('refresh_token')
  },
}

// ── JWT ──────────────────────────────────────────────────────────
function _decodeJwtExp(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64)).exp ?? null
  } catch { return null }
}
export function isTokenExpired(token) {
  if (!token) return true
  const exp = _decodeJwtExp(token)
  if (exp === null) return false
  return Date.now() / 1000 >= exp - 30
}

// ── RateLimitError ───────────────────────────────────────────────
export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT')
    this.name = 'RateLimitError'
  }
}

// ── rateLimitStorage — 10 daqiqa ─────────────────────────────────
export const rateLimitStorage = {
  WINDOW_MS: 10 * 60 * 1000,
  set:  () => localStorage.setItem('rate_limited_at', Date.now().toString()),
  get:  () => Number(localStorage.getItem('rate_limited_at') || 0),
  clear: () => localStorage.removeItem('rate_limited_at'),
  isActive: () => {
    const t = rateLimitStorage.get()
    return t > 0 && (Date.now() - t) < rateLimitStorage.WINDOW_MS
  },
  remainingMs: () => {
    const t = rateLimitStorage.get()
    if (!t) return 0
    return Math.max(0, rateLimitStorage.WINDOW_MS - (Date.now() - t))
  },
}

// ── refreshTracker — 5s da 8+ → rate limit ───────────────────────
export const refreshTracker = {
  WINDOW_MS: 5000,
  MAX_LOADS: 8,
  add() {
    const now    = Date.now()
    const raw    = localStorage.getItem('_rl_loads')
    const prev   = raw ? JSON.parse(raw) : []
    const recent = prev.filter(t => now - t < this.WINDOW_MS)
    recent.push(now)
    localStorage.setItem('_rl_loads', JSON.stringify(recent))
    return recent.length
  },
  clear: () => localStorage.removeItem('_rl_loads'),
}

// ── request() ────────────────────────────────────────────────────
let _isRefreshing = false

export async function request(path, options = {}, _retry = false) {
  const token   = tokenStorage.get()
  const headers = { ...(options.headers || {}) }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // 429 → token O'CHIRILMAYDI
  if (res.status === 429) {
    rateLimitStorage.set()
    throw new RateLimitError()
  }

  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().json().catch(() => ({}))
    const msg  = body.errorMessage || ''
    if (msg.toLowerCase().includes('blok') || msg.toLowerCase().includes('block')) {
      const fullName = localStorage.getItem('user_fullname') || ''
      tokenStorage.clear()
      window.location.replace(`${getMainSite()}/login?action=blocked&name=${encodeURIComponent(fullName)}`)
      throw new Error('Hisobingiz bloklangan.')
    }
  }

  if (res.status === 401) {
    if (_retry || _isRefreshing) {
      tokenStorage.clear()
      window.location.href = `${getMainSite()}/login?action=logout`
      throw new Error('Sessiya tugadi.')
    }
    const rt = tokenStorage.getRefresh()
    if (!rt) {
      tokenStorage.clear()
      window.location.href = `${getMainSite()}/login?action=logout`
      throw new Error('Sessiya tugadi.')
    }
    try {
      _isRefreshing = true
      const rRes = await fetch(`${BASE_URL}/api/v1/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      })
      if (rRes.status === 429) {
        _isRefreshing = false
        rateLimitStorage.set()
        throw new RateLimitError()
      }
      if (!rRes.ok) throw new Error('Refresh failed')
      const data = await rRes.json()
      if (data.token)        tokenStorage.set(data.token)
      if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken)
      _isRefreshing = false
      return request(path, options, true)
    } catch (e) {
      _isRefreshing = false
      if (e instanceof RateLimitError) throw e
      tokenStorage.clear()
      window.location.href = `${getMainSite()}/login?action=logout`
      throw new Error('Sessiya tugadi.')
    }
  }

  if (!res.ok) {
    const err  = await res.json().catch(() => ({}))
    const msg  = err.errorMessage || err.detail || err.message || err.error || `Xato: ${res.status}`
    const errObj = new Error(msg)
    errObj.apiError = err
    throw errObj
  }

  return res
}

// ── tryRefreshSilently ───────────────────────────────────────────
export async function tryRefreshSilently() {
  const rt = tokenStorage.getRefresh()
  if (!rt) return null
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (res.status === 429) { rateLimitStorage.set(); throw new RateLimitError() }
    if (!res.ok) return null
    const data = await res.json()
    if (data.token)        tokenStorage.set(data.token)
    if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken)
    return data.token || null
  } catch (e) {
    if (e instanceof RateLimitError) throw e
    return null
  }
}

// ── Public helpers ───────────────────────────────────────────────
export function getMainSite() {
  if (import.meta.env.VITE_MAIN_SITE_URL) return import.meta.env.VITE_MAIN_SITE_URL
  if (window.location.hostname === 'localhost') return 'http://localhost:5173'
  return 'https://uzintellekt.uz'
}

export async function getMe() {
  const res = await request('/api/v1/users/me')
  return res.json()
}

export async function updateMe(data) {
  const res = await request('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(data) })
  return res.json()
}

export async function updateMeField(field, value) {
  const allowed = ['address', 'phones', 'pseudonym', 'pseudoname']
  if (!allowed.includes(field)) throw new Error(`Noto'g'ri maydon: ${field}`)
  if (field === 'phones') {
    const phones = Array.isArray(value) ? value : [value]
    for (const p of phones) {
      if (!/^998\d{9}$/.test(p)) throw new Error(`Noto'g'ri telefon: ${p}`)
    }
    value = phones
  }
  if (field === 'address' && (!value || !value.trim())) throw new Error("Manzil bo'sh bo'lishi mumkin emas")
  const cur = await getMe()
  const payload = {
    address: cur.address, phones: cur.phones,
    pseudonym: cur.pseudonym || cur.pseudoname || null,
    pseudoname: cur.pseudonym || cur.pseudoname || null,
  }
  if (field === 'pseudonym' || field === 'pseudoname') {
    payload.pseudonym = value || null
    payload.pseudoname = value || null
  } else {
    payload[field] = value
  }
  return updateMe(payload)
}

export async function loginWithOneIdCode(authCode) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/sso/one-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authCode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errorMessage || `Login xatosi: ${res.status}`)
  }
  const data = await res.json()
  if (data.token)        tokenStorage.set(data.token)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken)
  return data
}