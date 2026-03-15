// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from 'react'
import { ONEID_CONFIG, generateState } from '../config/oneid.config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── App ochilganda tokenni tekshir ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    token ? fetchMe(token) : setLoading(false)
  }, [])

  const fetchMe = async (token) => {
    try {
      const res = await fetch(`${ONEID_CONFIG.apiBase}${ONEID_CONFIG.endpoints.me}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUser(data.user)
    } catch {
      localStorage.removeItem('access_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // ── Login → OneID sahifasiga redirect ──────────────────────
  const loginWithOneId = () => {
    if (!ONEID_CONFIG.clientId) {
      console.error('VITE_ONEID_CLIENT_ID sozlanmagan!')
      return
    }
    const state = generateState()
    sessionStorage.setItem('oneid_state', state)
    sessionStorage.setItem('oneid_action', 'login')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     ONEID_CONFIG.clientId,
      redirect_uri:  ONEID_CONFIG.redirectUri,
      scope:         'basic',
      state,
    })
    window.location.href = `${ONEID_CONFIG.authUrl}?${params}`
  }

  // ── Register → form data saqla → OneID ga redirect ─────────
  const registerWithOneId = (formData) => {
    if (!ONEID_CONFIG.clientId) {
      console.error('VITE_ONEID_CLIENT_ID sozlanmagan!')
      return
    }
    const state = generateState()
    sessionStorage.setItem('oneid_state',   state)
    sessionStorage.setItem('oneid_action',  'register')
    sessionStorage.setItem('register_form', JSON.stringify(formData))

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     ONEID_CONFIG.clientId,
      redirect_uri:  ONEID_CONFIG.redirectUri,
      scope:         'basic',
      state,
    })
    window.location.href = `${ONEID_CONFIG.authUrl}?${params}`
  }

  // ── Callback: code + state → backend → JWT ─────────────────
  const handleCallback = async (code, state) => {
    // 1. CSRF tekshirish
    const savedState = sessionStorage.getItem('oneid_state')
    if (!savedState || state !== savedState) {
      throw new Error("Xavfsizlik xatosi. Qayta urinib ko'ring.")
    }

    const action    = sessionStorage.getItem('oneid_action') || 'login'
    const savedForm = sessionStorage.getItem('register_form')

    // 2. Backend endpointi
    const endpoint = action === 'register'
      ? ONEID_CONFIG.endpoints.register
      : ONEID_CONFIG.endpoints.login

    const body = {
      code,
      redirect_uri: ONEID_CONFIG.redirectUri,
      ...(action === 'register' && savedForm ? JSON.parse(savedForm) : {}),
    }

    const res = await fetch(`${ONEID_CONFIG.apiBase}${endpoint}`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Server xatosi: ${res.status}`)
    }

    const data = await res.json()

    // 3. Token va user saqlash
    if (data.access_token) localStorage.setItem('access_token', data.access_token)
    if (data.user)         setUser(data.user)

    // 4. Cleanup
    sessionStorage.removeItem('oneid_state')
    sessionStorage.removeItem('oneid_action')
    sessionStorage.removeItem('register_form')

    return action
  }

  // ── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    const token = localStorage.getItem('access_token')
    try {
      await fetch(`${ONEID_CONFIG.apiBase}${ONEID_CONFIG.endpoints.logout}`, {
        method:      'POST',
        headers:     { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
    } catch {
      // server xato bo'lsa ham localdan tozala
    } finally {
      localStorage.removeItem('access_token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOneId, registerWithOneId, handleCallback, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
