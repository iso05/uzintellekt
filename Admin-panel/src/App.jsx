import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login        from './pages/Login/Login'
import Dashboard    from './pages/Dashboard/Dashboard'
import UsersList    from './pages/Users/UsersList'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider }         from './context/ThemeContext'

/* ── Loading spinner ───────────────────────────────────────── */
function GlobalLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ── Route guards ───────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <GlobalLoader />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <GlobalLoader />
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

/* ── App ────────────────────────────────────────────────────── */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/login"
              element={<PublicRoute><Login /></PublicRoute>}
            />

            {/* Dashboard shell */}
            <Route
              path="/dashboard"
              element={<Navigate to="/dashboard/overview" replace />}
            />

            {/* Overview page */}
            <Route
              path="/dashboard/overview"
              element={<ProtectedRoute><Dashboard initialPage="overview" /></ProtectedRoute>}
            />

            {/* Users page */}
            <Route
              path="/dashboard/users"
              element={<ProtectedRoute><Dashboard initialPage="users" /></ProtectedRoute>}
            />

            {/* Contracts page */}
            <Route
              path="/dashboard/contracts"
              element={<ProtectedRoute><Dashboard initialPage="contracts" /></ProtectedRoute>}
            />

            {/* Works page */}
            <Route
              path="/dashboard/works"
              element={<ProtectedRoute><Dashboard initialPage="works" /></ProtectedRoute>}
            />

            {/* Create Work page */}
            <Route
              path="/dashboard/create-work"
              element={<ProtectedRoute><Dashboard initialPage="create-work" /></ProtectedRoute>}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
