// src/pages/RateLimitPage.jsx
import { useState, useEffect, useRef } from 'react'
import { rateLimitStorage } from '../services/api'

export default function RateLimitPage({ retryAfterRateLimit }) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [canRetry, setCanRetry] = useState(false)
  const [autoRetrying, setAutoRetrying] = useState(false)
  const autoFired = useRef(false)

  // ── Taymer: har soniya remainingMs() dan hisoblaydi ──────────
  useEffect(() => {
    const tick = () => {
      const ms = rateLimitStorage.remainingMs()
      setSecondsLeft(Math.ceil(ms / 1000))
      setCanRetry(ms <= 0)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Taymer 0 → 2 soniya kutib AVTOMATIK urinish ──────────────
  useEffect(() => {
    if (canRetry && !autoFired.current) {
      autoFired.current = true
      setAutoRetrying(true)
      const t = setTimeout(() => {
        retryAfterRateLimit()
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [canRetry, retryAfterRateLimit])

  // ── Format MM:SS ──────────────────────────────────────────────
  const fmt = (s) => {
    const m = Math.floor(Math.max(0, s) / 60)
    const sec = Math.max(0, s) % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Progress 0→100 over 10 minutes
  const totalSec = rateLimitStorage.WINDOW_MS / 1000
  const elapsed = totalSec - Math.max(0, secondsLeft)
  const progress = Math.min(100, (elapsed / totalSec) * 100)

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .rl-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div style={S.card}>
        {/* Icon */}
        <div
          style={{
            ...S.iconWrap,
            borderColor: autoRetrying ? '#7DCB9E' : '#F0C060',
          }}
        >
          {autoRetrying ? (
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="#1E7D4A"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="#C8922A"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>

        {/* Sarlavha */}
        <h1 style={S.title}>
          {autoRetrying
            ? 'Tizimga kirilmoqda...'
            : "Juda ko'p so'rov yuborildi"}
        </h1>

        {/* Tavsif */}
        <p style={S.desc}>
          {autoRetrying ? (
            <>
              Mavjud token tekshirilmoqda.{' '}
              <span style={{ color: '#2C4F8A', fontWeight: 600 }}>
                OneID ga o'tilmaydi.
              </span>
            </>
          ) : (
            <>
              Xavfsizlik tizimi vaqtincha kirishni cheklab qo'ydi.
              <br />
              <strong>10 daqiqadan so'ng</strong> avtomatik tizimga kirasiz.
            </>
          )}
        </p>

        {/* Taymer bloki */}
        {!autoRetrying && (
          <div style={S.timerBlock}>
            {/* Progress bar */}
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width: `${progress}%` }} />
            </div>

            {/* MM:SS */}
            {!canRetry ? (
              <div style={S.timerBadge}>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#C8922A"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                <span style={S.timerNum}>{fmt(secondsLeft)}</span>
                <span style={S.timerLabel}>qoldi</span>
              </div>
            ) : (
              <div style={S.readyBadge}>
                ✓ Vaqt tugadi — avtomatik kirilmoqda...
              </div>
            )}
          </div>
        )}

        {/* Tugmalar */}
        {!autoRetrying && (
          <div style={S.buttonGroup}>
            {/* Qayta kirish tugmasi */}
            <button
              className="rl-btn"
              disabled={!canRetry}
              onClick={() => {
                if (!canRetry) return
                setAutoRetrying(true)
                retryAfterRateLimit()
              }}
              style={{
                ...S.btn,
                background: canRetry ? '#2C4F8A' : '#EEF4FB',
                color: canRetry ? '#fff' : '#9AA5B8',
                cursor: canRetry ? 'pointer' : 'not-allowed',
                transition: 'all 0.18s ease',
              }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {canRetry
                ? 'Qayta kirishga urinish'
                : `Kutilmoqda... (${fmt(secondsLeft)})`}
            </button>

            {/* Asosiy sahifaga o'tish tugmasi */}
            <button
              onClick={() => {
                const mainSite = window.location.hostname.includes('dashboard')
                  ? 'https://uzintellekt.uz'
                  : window.location.origin
                window.location.href = mainSite
              }}
              style={{
                ...S.btn,
                background: '#F3F5F9',
                color: '#2C4F8A',
                border: '1px solid #DDE2EC',
                cursor: 'pointer',
                marginTop: 10,
              }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Asosiy sahifaga qaytish
            </button>
          </div>
        )}

        {/* Izoh */}
        <p style={S.note}>
          {autoRetrying ? (
            <>Tizim tekshirilmoqda, biroz kuting...</>
          ) : (
            <>
              Muammo davom etsa,{' '}
              <a
                href="https://uzintellekt.uz/contact"
                style={{ color: '#2C4F8A', textDecoration: 'none' }}
              >
                administrator bilan bog'laning
              </a>
              .
            </>
          )}
        </p>
      </div>
    </div>
  )
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F3F5F9',
    fontFamily: "'Inter', sans-serif",
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #DDE2EC',
    borderTop: '4px solid #E8A020',
    boxShadow: '0 4px 24px rgba(44,79,138,0.10)',
    padding: '44px 40px 36px',
    maxWidth: 460,
    width: '100%',
    textAlign: 'center',
    animation: 'fadeUp 0.3s ease',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: '50%',
    background: '#FEF5E7',
    border: '2px solid #F0C060',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    transition: 'border-color 0.3s',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1E2A3B',
    margin: '0 0 10px',
  },
  desc: {
    fontSize: 13.5,
    color: '#4F5F74',
    margin: '0 0 24px',
    lineHeight: 1.65,
  },
  timerBlock: { marginBottom: 20 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    background: '#EEF4FB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    background: 'linear-gradient(90deg, #2C4F8A 0%, #5A8FD4 100%)',
    transition: 'width 1s linear',
  },
  timerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    borderRadius: 6,
    background: '#FEF5E7',
    border: '1px solid #F0C060',
  },
  timerNum: {
    fontSize: 26,
    fontWeight: 700,
    color: '#C8922A',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.04em',
  },
  timerLabel: { fontSize: 12, color: '#C8922A', fontWeight: 500 },
  readyBadge: {
    padding: '10px 16px',
    borderRadius: 6,
    background: '#E8F5EE',
    border: '1px solid #7DCB9E',
    fontSize: 13,
    color: '#1E7D4A',
    fontWeight: 600,
  },
  btn: {
    width: '100%',
    padding: '12px 24px',
    borderRadius: 5,
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  note: { fontSize: 11.5, color: '#B0BAC8', margin: 0, lineHeight: 1.6 },
}
