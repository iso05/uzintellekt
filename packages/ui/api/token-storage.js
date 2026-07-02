import { safeLocalStorage, safeSessionStorage } from '@shared/lib/safe-storage'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const ACCESS_EXP_KEY = 'access_expires_at'
const REFRESH_EXP_KEY = 'refresh_expires_at'

const FALLBACK_ACCESS_TTL_SEC = 3600
const FALLBACK_REFRESH_TTL_SEC = 86400

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

function _readToken(lsKey, cookieKey) {
  const ls = safeLocalStorage.getItem(lsKey)
  if (ls) return ls
  const ck = _readCookie(cookieKey)
  if (ck) {
    safeLocalStorage.setItem(lsKey, ck)
    return ck
  }
  return null
}

function _expiryFromSeconds(expiresInSec) {
  const ttl = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : null
  if (ttl === null) return null
  return Date.now() + ttl * 1000
}

function _readExpiry(key) {
  const raw = safeLocalStorage.getItem(key)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export const tokenStorage = {
  get: () => _readToken(ACCESS_KEY, ACCESS_KEY),
  set: (token, expiresInSec) => {
    const ttl = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : FALLBACK_ACCESS_TTL_SEC
    safeLocalStorage.setItem(ACCESS_KEY, token)
    const expiry = _expiryFromSeconds(ttl)
    if (expiry) safeLocalStorage.setItem(ACCESS_EXP_KEY, String(expiry))
    _writeCookie(ACCESS_KEY, token, ttl)
  },
  getRefresh: () => _readToken(REFRESH_KEY, REFRESH_KEY),
  setRefresh: (token, expiresInSec) => {
    const ttl = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : FALLBACK_REFRESH_TTL_SEC
    safeLocalStorage.setItem(REFRESH_KEY, token)
    const expiry = _expiryFromSeconds(ttl)
    if (expiry) safeLocalStorage.setItem(REFRESH_EXP_KEY, String(expiry))
    _writeCookie(REFRESH_KEY, token, ttl)
  },
  getAccessExpiry: () => _readExpiry(ACCESS_EXP_KEY),
  getRefreshExpiry: () => _readExpiry(REFRESH_EXP_KEY),
  isAccessExpiring: (leewaySec = 30) => {
    const exp = _readExpiry(ACCESS_EXP_KEY)
    if (exp === null) return true
    return Date.now() >= exp - leewaySec * 1000
  },
  isRefreshExpired: (leewaySec = 5) => {
    const exp = _readExpiry(REFRESH_EXP_KEY)
    if (exp === null) return true
    return Date.now() >= exp - leewaySec * 1000
  },
  clear: () => {
    safeLocalStorage.removeItem(ACCESS_KEY)
    safeLocalStorage.removeItem(REFRESH_KEY)
    safeLocalStorage.removeItem(ACCESS_EXP_KEY)
    safeLocalStorage.removeItem(REFRESH_EXP_KEY)
    safeSessionStorage.clear()
    _deleteCookie(ACCESS_KEY)
    _deleteCookie(REFRESH_KEY)
  },
}
