/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { loginRequest, getMeRequest } from '../services/authService'
import { tokenStorage } from '../services/api'
import { mapUser } from '../utils/authHelpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while we verify stored token

  /* ── On mount: restore session from localStorage ─────────── */
  useEffect(() => {
    const restore = async () => {
      const token = tokenStorage.getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await getMeRequest()
        setUser(mapUser(data))
      } catch {
        // Token invalid / expired and refresh also failed (interceptor already cleared)
        tokenStorage.clearTokens()
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  /* ── Login: POST /api/v1/auth/login → GET /api/v1/users/me ── */
  const login = useCallback(async (username, password) => {
    try {
      const { data: tokens } = await loginRequest(username, password)
      tokenStorage.setTokens(tokens.token, tokens.refreshToken)

      const { data: me } = await getMeRequest()
      setUser(mapUser(me))
      return { success: true }
    } catch (err) {
      tokenStorage.clearTokens()
      const msg =
        err.response?.data?.errorMessage ||
        err.response?.data?.message ||
        err.message ||
        'Invalid username or password.'
      return { success: false, message: msg }
    }
  }, [])

  /* ── Logout ─────────────────────────────────────────────── */
  const logout = useCallback(() => {
    tokenStorage.clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
