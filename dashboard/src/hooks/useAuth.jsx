// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import {
  getMe, tokenStorage, getMainSite, loginWithOneIdCode,
  isTokenExpired, tryRefreshSilently,
  RateLimitError, rateLimitStorage, refreshTracker,
} from '../services/api'

const AuthContext = createContext(null)
const TEST_MODE   = import.meta.env.VITE_TEST_MODE === 'true'
const MOCK_USER   = {
  id: 'test-001', firstName: 'Test', lastName: 'Foydalanuvchi',
  isMember: true, userType: 'INDIVIDUAL', pinfl: '00000000000000',
  phones: [], address: '', pseudonym: '', _isTestMode: true,
}

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [authError,   setAuthError]   = useState(null)
  const [rateLimited, setRateLimited] = useState(false)
  const initialized = useRef(false)

  async function processAuth() {
    const code     = new URLSearchParams(window.location.search).get('code')
    const mainSite = getMainSite()

    try {
      // ════════════════════════════════════════════════════════
      // STEP 1 — localStorage da eski rate limit bormi?
      // ════════════════════════════════════════════════════════
      if (rateLimitStorage.isActive()) {
        setRateLimited(true)
        setLoading(false)
        return
      }

      // ════════════════════════════════════════════════════════
      // STEP 2 — refreshTracker (API chaqirilmaydi)
      // ════════════════════════════════════════════════════════
      if (!code) {
        const count = refreshTracker.add()
        if (count >= refreshTracker.MAX_LOADS) {
          rateLimitStorage.set()
          setRateLimited(true)
          setLoading(false)
          return
        }
      }

      // ── OneID callback ────────────────────────────────────
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname)
        await loginWithOneIdCode(code)
        refreshTracker.clear()
      }

      // ── Token tekshirish ──────────────────────────────────
      const hasAccess  = !!tokenStorage.get()
      const hasRefresh = !!tokenStorage.getRefresh()
      if (!hasAccess && !hasRefresh) {
        setLoading(false)
        window.location.replace(`${mainSite}/login`)
        return
      }

      // ── Silent refresh ────────────────────────────────────
      if (isTokenExpired(tokenStorage.get())) {
        await tryRefreshSilently() // 429 → RateLimitError → catch da ushlanadi
      }

      // ════════════════════════════════════════════════════════
      // STEP 3 — getMe() → 429 → RateLimitError
      // ════════════════════════════════════════════════════════
      const data = await getMe()

      // Popup
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: 'ONEID_SUCCESS', user: data, token: tokenStorage.get() }, '*')
        window.close()
        return
      }

      // Bloklangan
      if (data?.state === 'BLOCKED' || data?.status === 'BLOCKED') {
        tokenStorage.clear()
        const name = data.userType === 'LEGAL'
          ? data.legalName
          : [data.lastName, data.firstName, data.middleName].filter(Boolean).join(' ')
        window.location.replace(`${mainSite}/login?action=blocked&name=${encodeURIComponent(name)}`)
        return
      }

      // A'zo emas
      if (!data.isMember) {
        const url = new URL(`${mainSite}/register`)
        if (tokenStorage.get())        url.searchParams.set('token', tokenStorage.get())
        if (tokenStorage.getRefresh()) url.searchParams.set('refresh', tokenStorage.getRefresh())
        setLoading(false)
        window.location.replace(url.toString())
        return
      }

      // ── Muvaffaqiyatli ────────────────────────────────────
      const fullName = data.userType === 'LEGAL'
        ? data.legalName
        : [data.lastName, data.firstName, data.middleName].filter(Boolean).join(' ')
      localStorage.setItem('user_fullname', fullName)
      rateLimitStorage.clear()
      refreshTracker.clear()
      setUser(data)
      setLoading(false)

    } catch (err) {
      // ════════════════════════════════════════════════════════
      // RateLimitError — token O'CHIRILMAYDI (3 ta path)
      // ════════════════════════════════════════════════════════
      if (err instanceof RateLimitError) {
        rateLimitStorage.set()      // vaqtni yoz
        setRateLimited(true)        // sahifa ko'rsat
        setLoading(false)
        return                      // token saqlanib qoladi ✅
      }

      // Bloklangan xato
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('blok') || msg.toLowerCase().includes('block')) {
        tokenStorage.clear()
        setAuthError('Siz administrator tomonidan bloklandingiz!')
        setTimeout(() => {
          const name = localStorage.getItem('user_fullname') || ''
          window.location.replace(`${getMainSite()}/login?action=blocked&name=${encodeURIComponent(name)}`)
        }, 4000)
        return
      }

      // Boshqa xato — agar token yo'q bo'lsa login ga
      if (!tokenStorage.get() && !tokenStorage.getRefresh()) {
        setLoading(false)
        window.location.replace(`${getMainSite()}/login`)
        return
      }

      setAuthError(msg || 'Kirish xatosi.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (TEST_MODE) { setUser(MOCK_USER); setLoading(false); return }
    if (initialized.current) return
    initialized.current = true
    processAuth()
  }, []) // eslint-disable-line

  // Cross-tab: faqat haqiqiy logout bo'lsa react qil
  useEffect(() => {
    if (TEST_MODE) return
    const handler = (e) => {
      if (e.key === 'rate_limited_at' || e.key === '_rl_loads') return
      if (rateLimitStorage.isActive()) return
      if (e.key === 'access_token' && !e.newValue && !tokenStorage.getRefresh()) {
        setUser(null)
        window.location.replace(`${getMainSite()}/login?action=logout`)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // ── Logout: FAQAT bu yerda tokenlar o'chiriladi ───────────────
  const logout = () => {
    setUser(null)
    tokenStorage.clear()
    rateLimitStorage.clear()
    refreshTracker.clear()
    sessionStorage.clear()
    window.location.replace(`${getMainSite()}/login?action=logout`)
  }

  // ── 10 daqiqa o'tgach qayta urinish ──────────────────────────
  const retryAfterRateLimit = async () => {
    rateLimitStorage.clear()
    refreshTracker.clear()
    setRateLimited(false)
    setLoading(true)
    await processAuth()
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, authError, rateLimited, retryAfterRateLimit }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}