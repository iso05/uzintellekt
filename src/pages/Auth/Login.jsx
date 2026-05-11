// src/pages/Auth/Login.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import useScrollToTop from '../../hooks/useScrollToTop'

export default function Login() {
  useScrollToTop()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading, loginWithOneId, handleCallback } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // StrictMode / double-mount himoyasi
  const callbackProcessed = useRef(false)

  // Allaqachon kirgan (token bor, sessiya aktiv) → to'g'ri yo'naltirish
  // FAQAT code parametri yo'q bo'lganda — aks holda callback o'zi navigate qiladi
  const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.uzintellekt.uz'

  useEffect(() => {
    const hasCode = Boolean(searchParams.get('code'))
    if (!loading && user && !hasCode) {
      if (user.isMember) {
        window.location.replace(DASHBOARD_URL)
      } else {
        navigate('/register', { replace: true })
      }
    }
  }, [loading, user, searchParams, navigate])

  // OneID callback: /login?code=...&state=...
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('OneID orqali kirishda xatolik: ' + errorParam)
      return
    }
    if (!code) return
    if (callbackProcessed.current) return
    callbackProcessed.current = true

    // URL dan code/state ni tozalash — brauzer tarixida qolmasin
    window.history.replaceState({}, '', '/login')
    setIsLoading(true)
    setError(null)

    handleCallback(code, state)
      .then(({ isMember }) => {
        setIsLoading(false)

        if (isMember) {
          window.location.replace(DASHBOARD_URL)
        } else {
          navigate('/register', { replace: true })
        }
      })
      .catch((err) => {
        setError(err.message || 'Xatolik yuz berdi. Qayta urining.')
        setIsLoading(false)
        callbackProcessed.current = false
      })
  }, [searchParams, handleCallback, navigate])

  const handleLoginClick = () => {
    setError(null)
    loginWithOneId()
  }

  return (
    <section style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 8px 28px rgba(168,85,247,.4); }
          50%       { box-shadow: 0 8px 40px rgba(168,85,247,.7); }
        }
        .login-card { animation: fadeUp .4s ease both; }
        .oneid-btn  { transition: transform .15s, box-shadow .15s; }
        .oneid-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(168,85,247,.55) !important;
        }
        .oneid-btn:active:not(:disabled) { transform: scale(.97); }
      `}</style>

      {/* BG blobs */}
      <div
        style={{
          ...S.blob,
          top: '-120px',
          left: '-80px',
          width: 420,
          height: 420,
          background:
            'radial-gradient(circle, rgba(99,102,241,.28) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          ...S.blob,
          bottom: '-100px',
          right: '-80px',
          width: 380,
          height: 380,
          background:
            'radial-gradient(circle, rgba(168,85,247,.22) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          ...S.blob,
          top: '35%',
          right: '5%',
          width: 180,
          height: 180,
          background:
            'radial-gradient(circle, rgba(59,130,246,.18) 0%, transparent 70%)',
        }}
      />

      <div style={S.wrap}>
        <div style={S.card} className="login-card">
          {/* Lock icon */}
          <div style={S.iconWrap}>
            <div style={S.iconBox}>
              <svg
                width="34"
                height="34"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" fill="white" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div style={S.titleBlock}>
            <h1 style={S.h1}>
              {isLoading ? 'Tekshirilmoqda...' : 'Xush kelibsiz'}
            </h1>
            <p style={S.subtitle}>uzintellekt.uz platformasiga kirish</p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={S.spinnerWrap}>
              <div style={S.spinner} />
              <p style={S.spinnerText}>OneID orqali autentifikatsiya...</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div style={S.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* OneID button */}
          {!isLoading && (
            <>
              <button
                className="oneid-btn"
                onClick={handleLoginClick}
                style={S.oneIdBtn}
              >
                <svg
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                    10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34
                    3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0
                    14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08
                    6-3.08 1.99 0 5.97 1.09 6 3.08-1.29
                    1.94-3.5 3.22-6 3.22z"
                  />
                </svg>
                OneID bilan kirish
              </button>
              <p style={S.hint}>
                🔐 O'zbekiston Davlat xizmatlari — id.egov.uz orqali xavfsiz
                kirish
              </p>
            </>
          )}
        </div>

        {/* Security badges */}
        <div style={S.badges}>
          {[
            ['🛡️', 'Xavfsiz'],
            ['⚡', 'Tez'],
            ['🔐', 'Shifrlangan'],
            ['✓', 'Verified'],
          ].map(([icon, label]) => (
            <div key={label} style={S.badge}>
              <span style={{ fontSize: '18px' }}>{icon}</span>
              <span style={S.badgeLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    padding: '32px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(50px)',
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    background: 'rgba(255,255,255,.06)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: '28px',
    padding: '44px 36px',
    boxShadow: '0 32px 80px rgba(0,0,0,.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  iconWrap: { display: 'flex', justifyContent: 'center' },
  iconBox: {
    width: '76px',
    height: '76px',
    borderRadius: '22px',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'glow 3s ease-in-out infinite',
  },
  titleBlock: { textAlign: 'center' },
  h1: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  subtitle: { fontSize: '14px', color: 'rgba(255,255,255,.45)', margin: 0 },
  spinnerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 0',
  },
  spinner: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,.12)',
    borderTopColor: '#a855f7',
    animation: 'spin 1s linear infinite',
  },
  spinnerText: { color: 'rgba(255,255,255,.55)', fontSize: '14px', margin: 0 },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(239,68,68,.15)',
    border: '1px solid rgba(239,68,68,.3)',
    color: '#fecaca',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  oneIdBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 8px 28px rgba(168,85,247,.4)',
  },
  hint: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(147,197,253,.55)',
    margin: 0,
  },
  badges: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: '12px',
    gap: '4px',
  },
  badgeLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,.4)',
    fontWeight: '500',
  },
}
