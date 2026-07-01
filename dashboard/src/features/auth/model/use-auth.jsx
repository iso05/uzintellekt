import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { ENV, getMainSite } from '@/shared/config/env'
import { safeLocalStorage, safeSessionStorage } from '@/shared/lib/safe-storage'
import { clearAllDrafts } from '@/shared/lib/draft-storage'
import {
  tokenStorage,
  tryRefreshSilently,
  loginWithOneIdCode,
} from '@/shared/api'
import { getMe, getUserFullName, isBlocked } from '@/entities/user'

const AuthContext = createContext(null)

const MOCK_USER = {
  id: 'test-001',
  firstName: 'Test',
  lastName: 'Foydalanuvchi',
  isMember: true,
  userType: 'INDIVIDUAL',
  pinfl: '00000000000000',
  phones: [],
  address: '',
  pseudonym: '',
  _isTestMode: true,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const initialized = useRef(false)

  async function processAuth() {
    const code = new URLSearchParams(window.location.search).get('code')
    const mainSite = getMainSite()

    try {
      // OneID callback (authorization code → tokens)
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname)
        await loginWithOneIdCode(code)
      }

      const hasAccess = !!tokenStorage.get()
      const hasRefresh = !!tokenStorage.getRefresh()
      if (!hasAccess && !hasRefresh) {
        setLoading(false)
        window.location.replace(`${mainSite}/login`)
        return
      }

      // Refresh dead → no point trying — go straight to login.
      if (tokenStorage.isRefreshExpired()) {
        tokenStorage.clear()
        setLoading(false)
        window.location.replace(`${mainSite}/login`)
        return
      }

      // Pre-flight refresh (silent) — http.js interceptor also handles this,
      // but doing it here avoids the first getMe() call attempting with an expired token.
      if (tokenStorage.isAccessExpiring()) {
        await tryRefreshSilently()
      }

      const data = await getMe()

      // Popup OneID flow: post token back to opener
      if (window.opener && window.opener !== window) {
        // SECURITY: use specific origin (not '*') — only the known main site receives tokens
        window.opener.postMessage(
          { type: 'ONEID_SUCCESS', user: data, token: tokenStorage.get() },
          mainSite
        )
        window.close()
        return
      }

      if (isBlocked(data)) {
        tokenStorage.clear()
        const name = getUserFullName(data)
        window.location.replace(
          `${mainSite}/login?action=blocked&name=${encodeURIComponent(name)}`
        )
        return
      }

      if (!data.isMember) {
        // NOTE: Tokens passed via URL to preserve OneID session (avoid extra OneID calls).
        // TODO: remove when main site reads tokens from shared cookies (.uzintellekt.uz).
        const url = new URL(`${mainSite}/register`)
        if (tokenStorage.get()) url.searchParams.set('token', tokenStorage.get())
        if (tokenStorage.getRefresh()) url.searchParams.set('refresh', tokenStorage.getRefresh())
        setLoading(false)
        window.location.replace(url.toString())
        return
      }

      const fullName = getUserFullName(data)
      safeLocalStorage.setItem('user_fullname', fullName)
      setUser(data)
      setLoading(false)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('blok') || msg.toLowerCase().includes('block')) {
        tokenStorage.clear()
        setAuthError('Siz administrator tomonidan bloklandingiz!')
        setTimeout(() => {
          const name = safeLocalStorage.getItem('user_fullname') || ''
          window.location.replace(
            `${getMainSite()}/login?action=blocked&name=${encodeURIComponent(name)}`
          )
        }, 4000)
        return
      }

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
    if (initialized.current) return
    initialized.current = true

    if (ENV.TEST_MODE) {
      // If a real token is present, try to fetch real user; otherwise mock.
      const hasToken = !!tokenStorage.get() || !!tokenStorage.getRefresh()
      if (!hasToken) {
        setUser(MOCK_USER)
        setLoading(false)
        return
      }
      ;(async () => {
        try {
          const data = await getMe()
          if (data) {
            const fullName = getUserFullName(data)
            safeLocalStorage.setItem('user_fullname', fullName)
            setUser(data)
          } else {
            setUser(MOCK_USER)
          }
        } catch (e) {
          console.warn('[TEST_MODE] getMe failed, falling back to MOCK_USER:', e?.message)
          setUser(MOCK_USER)
        } finally {
          setLoading(false)
        }
      })()
      return
    }
    processAuth()
  }, [])

  // Cross-tab logout sync
  useEffect(() => {
    if (ENV.TEST_MODE) return
    const handler = (e) => {
      if (e.key === 'access_token' && !e.newValue && !tokenStorage.getRefresh()) {
        setUser(null)
        window.location.replace(`${getMainSite()}/login?action=logout`)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const logout = () => {
    setUser(null)
    tokenStorage.clear()
    safeSessionStorage.clear()
    clearAllDrafts()
    if (ENV.TEST_MODE) {
      // In test mode, just reload — no real site to redirect to.
      window.location.reload()
      return
    }
    window.location.replace(`${getMainSite()}/login?action=logout`)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}
