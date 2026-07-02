// src/pages/NotFound.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RiCompass3Line, RiHome4Line } from 'react-icons/ri'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div style={S.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        
        .floating-icon {
          animation: float 4s ease-in-out infinite;
        }
        
        .glow-effect {
          animation: pulse 3s ease-in-out infinite;
        }

        .back-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(168, 85, 247, 0.5);
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important;
        }
      `}</style>

      <div style={S.card}>
        <div style={S.iconWrapper} className="floating-icon">
          <RiCompass3Line size={72} color="#a855f7" />
          <div style={S.iconGlow} className="glow-effect" />
        </div>

        <h1 style={S.errorCode}>404</h1>
        <h2 style={S.title}>{t('notfound.title')}</h2>
        <p style={S.description}>{t('notfound.desc')}</p>

        <Link
          id="back-to-dashboard-btn"
          to="/"
          className="back-btn"
          style={S.button}
        >
          <RiHome4Line size={18} />
          {t('notfound.home')}
        </Link>
      </div>
    </div>
  )
}

const S = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '24px',
    fontFamily: "'Outfit', sans-serif",
  },
  card: {
    maxWidth: '460px',
    width: '100%',
    textAlign: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '48px 32px',
    boxShadow: '0 20px 40px -15px rgba(148, 163, 184, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120px',
    height: '120px',
    borderRadius: '32px',
    background: 'rgba(168, 85, 247, 0.06)',
    marginBottom: '28px',
  },
  iconGlow: {
    position: 'absolute',
    inset: '-8px',
    borderRadius: '40px',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    zIndex: -1,
  },
  errorCode: {
    fontSize: '76px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 12px',
  },
  description: {
    fontSize: '14.5px',
    lineHeight: '1.6',
    color: '#64748b',
    margin: '0 0 32px',
    fontWeight: '400',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '16px',
    fontSize: '14.5px',
    fontWeight: '600',
    textDecoration: 'none',
    boxShadow: '0 8px 16px -6px rgba(124, 58, 237, 0.3)',
    outline: 'none',
  },
}
