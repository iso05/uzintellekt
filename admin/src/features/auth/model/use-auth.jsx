import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ENV } from '@shared/config/env'
import { tokenStorage, tryRefreshSilently, login as apiLogin } from '@shared/api'
import { getMe, isAdmin } from '@/entities/user'

const AuthContext = createContext(null)

// TEST_MODE mounts a fake ADMIN so the shell is browsable without a backend.
// Flip VITE_TEST_MODE=false to exercise the real credential login + ADMIN gate.
const MOCK_ADMIN = {
  id: 'admin-test-001',
  firstName: 'Test',
  lastName: 'Admin',
  username: 'admin',
  role: 'ADMIN',
  state: 'ACTIVE',
  _isTestMode: true,
}

// Thrown when a successfully-authenticated user is not an ADMIN.
export class NotAdminError extends Error {
  constructor() {
    super('NOT_ADMIN')
    this.code = 'NOT_ADMIN'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const initialized = useRef(false)

  // Fetch the current user and assert the ADMIN role. On a non-admin we drop the
  // session so a stale/wrong-role token can't linger.
  const resolveAdmin = useCallback(async () => {
    const me = await getMe()
    if (!isAdmin(me)) {
      tokenStorage.clear()
      throw new NotAdminError()
    }
    return me
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    ;(async () => {
      if (ENV.TEST_MODE) {
        setUser(MOCK_ADMIN)
        setLoading(false)
        return
      }

      const hasAccess = !!tokenStorage.get()
      const hasRefresh = !!tokenStorage.getRefresh()
      if (!hasAccess && !hasRefresh) {
        setLoading(false)
        return
      }
      if (tokenStorage.isRefreshExpired()) {
        tokenStorage.clear()
        setLoading(false)
        return
      }

      try {
        if (tokenStorage.isAccessExpiring()) await tryRefreshSilently()
        const me = await resolveAdmin()
        setUser(me)
      } catch {
        // Invalid token / not admin → stay logged out; ProtectedRoute → /login.
        tokenStorage.clear()
      } finally {
        setLoading(false)
      }
    })()
  }, [resolveAdmin])

  const login = useCallback(
    async (username, password) => {
      setAuthError(null)
      await apiLogin(username, password) // persists tokens on success
      const me = await resolveAdmin()
      setUser(me)
      return me
    },
    [resolveAdmin]
  )

  const logout = useCallback(() => {
    setUser(null)
    tokenStorage.clear()
    if (ENV.TEST_MODE) {
      window.location.reload()
      return
    }
    window.location.replace('/login')
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setUser, authError, setAuthError }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}
