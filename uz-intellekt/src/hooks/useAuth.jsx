// src/hooks/useAuth.jsx
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react'
import { loginWithOneIdCode, getMe, tokenStorage } from '../services/api'
import { ONEID_CONFIG, generateState } from '../config/oneid.config'

const AuthContext = createContext(null)

// ══════════════════════════════════════════════════════════════
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── App ochilganda tokenni tekshir ─────────────────────────
  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((userData) => setUser(userData))
      .catch(() => {
        tokenStorage.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── OneID sahifasiga redirect ───────────────────────────────
  // URL: https://sso.egov.uz/sso/oauth/Authorization.do
  //   ?response_type=one_code
  //   &client_id=uzintellekt_uz
  //   &redirect_uri=https://dashboard.uzintellekt.uz
  //   &scope=uzintellekt_uz
  //   &state=<random>
  const loginWithOneId = useCallback(() => {
    // CSRF himoya: random state yaratamiz, callback tekshiruvi uchun saqlaymiz
    const state = generateState()
    sessionStorage.setItem('oneid_state', state)

    const params = new URLSearchParams({
      response_type: ONEID_CONFIG.responseType,
      client_id: ONEID_CONFIG.clientId,
      redirect_uri: ONEID_CONFIG.redirectUri,
      scope: ONEID_CONFIG.scope,
      state,
    })
    window.location.href = `${ONEID_CONFIG.authUrl}?${params.toString()}`
  }, [])

  // ── OneID callback ─────────────────────────────────────────
  // Login.jsx dan chaqiriladi: /login?code=...&state=...
  //
  // Swagger flow:
  //   1. POST /api/v1/auth/sso/one-id { authCode: code }
  //      → { token, refreshToken, expiresIn, refreshExpiresIn }
  //   2. GET  /api/v1/users/me
  //      → { id, firstName, ..., isMember: boolean }
  //
  // Returns: { isMember: boolean, user: UserInfoResponse }
  const handleCallback = useCallback(async (code, state) => {
    // CSRF tekshirish
    const savedState = sessionStorage.getItem('oneid_state')
    if (!savedState || state !== savedState) {
      sessionStorage.removeItem('oneid_state')
      throw new Error("Xavfsizlik xatosi. Qayta urinib ko'ring.")
    }
    sessionStorage.removeItem('oneid_state')

    if (!code) throw new Error('Authorization code topilmadi')

    // 1. Token olish — tokenStorage.set() api.js ichida bajariladi
    await loginWithOneIdCode(code)

    // 2. User ma'lumotlari (isMember shu yerda keladi)
    const userData = await getMe()
    setUser(userData)

    // isMember: true  → foydalanuvchi a'zo → /dashboard
    // isMember: false → yangi foydalanuvchi → /register
    return { user: userData, isMember: userData.isMember }
  }, [])

  // ── Logout va Cross-tab Sinxronizatsiya ──────────────────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' && !e.newValue) {
        setUser(null)
        // Agar boshqa tabda logout bo'lsa, main site da login ga qaytaramiz (agar protected saxiifada bo'lsa, bu haqida o'zi router qayg'uradi)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    tokenStorage.clear()
    sessionStorage.clear()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithOneId,
        handleCallback,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
