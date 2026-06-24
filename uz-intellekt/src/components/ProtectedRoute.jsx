// src/components/ProtectedRoute.jsx
// NOTE: /register va /login sahifalari o'zini o'zi qo'riqlaydi.
// Bu ProtectedRoute faqat kelgusida kerak bo'ladigan
// ichki himoyalangan sahifalar uchun saqlanib qoldi.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Token tekshirilmoqda — spinner
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,.12)',
            borderTopColor: '#a855f7',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Token yo'q → login sahifasiga yo'naltirish
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Foydalanuvchi autentifikatsiya qilingan → sahifani ko'rsatish
  return children
}
