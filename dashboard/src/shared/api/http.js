import { ENV, getMainSite } from '@/shared/config/env'
import { tokenStorage } from './token-storage'

// In TEST_MODE we never redirect — just throw so the UI shows errors/empty states.
function _bailOnAuth(message) {
  if (ENV.TEST_MODE) {
    const err = new Error(message)
    err.status = 401
    err._testModeBail = true
    throw err
  }
  tokenStorage.clear()
  window.location.href = `${getMainSite()}/login?action=logout`
  throw new Error(message)
}

// ── 429 retry policy ─────────────────────────────────────────────
// Silent backoff for nginx burst rate-limits.
//   - GET/HEAD: up to 10 attempts (init + 9 retries) with capped exponential backoff.
//   - Mutations (POST/PATCH/PUT/DELETE): NO retry (avoid duplicate side effects).
//   - After exhaustion: throw a regular Error with status=429.
const GET_BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 8000, 8000, 8000, 8000]
const RETRY_AFTER_CAP_MS = 10_000 // ignore server-suggested wait if longer than this
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD'])

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function _isRetryableMethod(init) {
  const m = (init?.method || 'GET').toUpperCase()
  return IDEMPOTENT_METHODS.has(m)
}

function _parseRetryAfter(res) {
  const h = res.headers.get('Retry-After')
  if (!h) return null
  const num = Number(h)
  if (!Number.isNaN(num) && num >= 0) return Math.round(num * 1000)
  const dateMs = Date.parse(h)
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now())
  return null
}

async function _fetchWithRateRetry(url, init) {
  if (!_isRetryableMethod(init)) {
    // Mutations: send once, never retry
    return fetch(url, init)
  }

  for (let attempt = 0; attempt <= GET_BACKOFF_MS.length; attempt++) {
    const res = await fetch(url, init)
    if (res.status !== 429) return res
    if (attempt >= GET_BACKOFF_MS.length) return res // exhausted

    const serverWait = _parseRetryAfter(res)
    const wait =
      serverWait != null && serverWait <= RETRY_AFTER_CAP_MS
        ? serverWait
        : GET_BACKOFF_MS[attempt]

    await _sleep(wait)
  }
  // unreachable
}

// ── Single-flight token refresh ──────────────────────────────────
let _refreshPromise = null

async function _doRefresh() {
  const rt = tokenStorage.getRefresh()
  if (!rt) return null

  // POST: no retry. If 429 — refresh fails, caller falls back to login redirect.
  const res = await _fetchWithRateRetry(`${ENV.API_BASE_URL}/api/v1/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  })

  if (!res.ok) return null

  const data = await res.json().catch(() => ({}))
  if (data.token) tokenStorage.set(data.token, data.expiresIn)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken, data.refreshExpiresIn)
  return data.token || null
}

function _refreshSingleFlight() {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null
  })
  return _refreshPromise
}

/**
 * Pre-flight: ensure we have a usable access token before sending a request.
 * Decision tree, driven by server-provided expiresIn / refreshExpiresIn deadlines:
 *   - No access AND no refresh → caller bails to /login.
 *   - Refresh expired → access is also dead → caller bails to /login (no network).
 *   - Access expiring (within leeway) → single-flight refresh, return new token.
 *   - Otherwise → current access is valid.
 */
async function ensureValidToken() {
  const access = tokenStorage.get()
  const refresh = tokenStorage.getRefresh()

  if (!access && !refresh) return null
  if (tokenStorage.isRefreshExpired()) return null
  if (!tokenStorage.isAccessExpiring()) return access

  return _refreshSingleFlight()
}

export async function tryRefreshSilently() {
  return ensureValidToken().catch(() => null)
}

// ── Block check helpers ─────────────────────────────────────────
function _isBlockedMessage(msg) {
  const m = (msg || '').toLowerCase()
  return m.includes('blok') || m.includes('block')
}

async function _handleBlocked(res) {
  const body = await res.clone().json().catch(() => ({}))
  if (_isBlockedMessage(body.errorMessage)) {
    if (ENV.TEST_MODE) {
      throw new Error('Hisobingiz bloklangan.')
    }
    const fullName = localStorage.getItem('user_fullname') || ''
    tokenStorage.clear()
    window.location.replace(
      `${getMainSite()}/login?action=blocked&name=${encodeURIComponent(fullName)}`
    )
    throw new Error('Hisobingiz bloklangan.')
  }
}

function _buildHeaders(options) {
  const token = tokenStorage.get()
  const headers = { ...(options.headers || {}) }
  if (typeof options.body === 'string') headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function _sendWithRateRetry(path, options) {
  return _fetchWithRateRetry(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers: _buildHeaders(options),
  })
}

// ── Main request ─────────────────────────────────────────────────
export async function request(path, options = {}) {
  // STEP 1 — pre-flight: refresh proactively or bail if everything is dead.
  const token = await ensureValidToken()
  if (!token) _bailOnAuth('Sessiya tugadi.')

  // STEP 2 — perform request (with silent 429 retry baked in for GET/HEAD)
  let res = await _sendWithRateRetry(path, options)

  // STEP 3 — explicit block check (401/403 with "blocked" message)
  if (res.status === 401 || res.status === 403) {
    await _handleBlocked(res)
  }

  // STEP 4 — 401 fallback: server invalidated the token (race / revocation).
  if (res.status === 401) {
    if (tokenStorage.isRefreshExpired()) _bailOnAuth('Sessiya tugadi.')
    const refreshed = await _refreshSingleFlight()
    if (!refreshed) _bailOnAuth('Sessiya tugadi.')
    res = await _sendWithRateRetry(path, options)
    if (res.status === 401) _bailOnAuth('Sessiya tugadi.')
  }

  // STEP 5 — 429 after retries exhausted (GET) or any 429 (mutation)
  if (res.status === 429) {
    const err = new Error("Server hozir band. Iltimos, biroz kutib qayta urinib ko'ring.")
    err.status = 429
    err.apiError = { errorMessage: 'TOO_MANY_REQUESTS' }
    throw err
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg =
      errBody.errorMessage || errBody.detail || errBody.message || errBody.error || `Xato: ${res.status}`
    const errObj = new Error(msg)
    errObj.apiError = errBody
    errObj.status = res.status
    throw errObj
  }

  return res
}

// GET dedup: identical concurrent GETs share one network roundtrip + one parsed JSON.
// Keyed by method+path (no body for GET). Mutations are never deduped.
const _jsonInflight = new Map()

async function _requestJsonRaw(path, options) {
  const res = await request(path, options)
  const ct = res.headers.get('content-type')
  if (ct && ct.includes('application/json')) return res.json()
  return null
}

export async function requestJson(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET') return _requestJsonRaw(path, options)

  const key = `GET ${path}`
  const pending = _jsonInflight.get(key)
  if (pending) return pending

  const promise = _requestJsonRaw(path, options).finally(() => {
    _jsonInflight.delete(key)
  })
  _jsonInflight.set(key, promise)
  return promise
}
