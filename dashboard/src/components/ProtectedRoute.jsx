// src/components/ProtectedRoute.jsx
import { useAuth } from '../hooks/useAuth'
import RateLimitPage from '../pages/RateLimitPage'

export default function ProtectedRoute({ children }) {
  const { user, loading, authError, rateLimited, retryAfterRateLimit } = useAuth()

  // ── Rate limit → RateLimitPage (token saqlanib qoladi) ───────
  if (rateLimited) {
    return <RateLimitPage retryAfterRateLimit={retryAfterRateLimit} />
  }

  // ── Yuklanmoqda / Xato ────────────────────────────────────────
  if (loading) {
    return (
      <div style={S.loadWrap}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {authError ? (
          <div style={S.errorCard}>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <p style={S.errorTitle}>Kirish amalga oshmadi</p>
            <p style={S.errorMsg}>{authError}</p>
            <p style={S.errorSub}>Login sahifasiga qaytarilmoqda...</p>
          </div>
        ) : (
          <>
            <div style={S.spinner} />
            <p style={S.loadText}>Tekshirilmoqda...</p>
          </>
        )}
      </div>
    )
  }

  // ── Foydalanuvchi yo'q ────────────────────────────────────────
  if (!user) return null

  return children
}

const S = {
  loadWrap: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 20,
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    fontFamily: "'Inter', sans-serif",
    padding: 20,
  },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '4px solid rgba(255,255,255,.12)',
    borderTopColor: '#a855f7',
    animation: 'spin 1s linear infinite',
  },
  loadText: { color: 'rgba(255,255,255,.45)', fontSize: 14, margin: 0 },
  errorCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: '32px 36px', maxWidth: 400, textAlign: 'center',
    background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)',
    borderRadius: 16,
  },
  errorTitle: { color: '#fca5a5', fontSize: 16, fontWeight: 700, margin: 0 },
  errorMsg:   { color: 'rgba(255,255,255,.7)', fontSize: 13, margin: 0, lineHeight: 1.5 },
  errorSub:   { color: 'rgba(255,255,255,.3)', fontSize: 12, margin: 0 },
}