// src/pages/Auth/Login.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loginWithOneId, handleCallback } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)

  // Allaqachon login bo'lgan → dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])

  // OneID callback: /login?code=...&state=...
  useEffect(() => {
    const code       = searchParams.get('code')
    const state      = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('OneID orqali kirishda xatolik: ' + errorParam)
      return
    }
    if (!code) return

    // URL ni tozalash
    window.history.replaceState({}, '', '/login')
    setIsLoading(true)

    handleCallback(code, state)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [searchParams])

  return (
    <section className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-blue-700 py-20 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/20">

          {/* HEADER */}
          <div className="text-center mb-10">
            <div className="inline-block p-3 rounded-2xl bg-linear-to-br from-purple-400 to-indigo-500 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLoading ? 'Kirilmoqda...' : 'Kirish'}
            </h1>
            <p className="text-white/60 text-sm">uzintellekt.uz ga xush kelibsiz</p>
          </div>

          {/* LOADING */}
          {isLoading && (
            <div className="mb-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/70 text-sm">OneID tasdiqlash kutilmoqda...</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-400/50 text-red-100 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* BUTTONS */}
          {!isLoading && (
            <div className="space-y-4">
              {/* OneID */}
              <button
                onClick={loginWithOneId}
                className="w-full relative group overflow-hidden rounded-2xl p-4 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95"
              >
                <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                  OneID bilan kirish
                </div>
              </button>

              
            </div>
          )}

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-sm">yoki</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <p className="text-center text-white/60 text-sm">
            Akkauntingiz yo'qmi?{' '}
            <a href="/register" className="text-white font-semibold hover:text-purple-200 transition-colors">
              Ro'yxatdan o'tish
            </a>
          </p>

          <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-200 text-xs text-center">
            🔐 O'zbekiston Davlat xizmatlari — OneID orqali xavfsiz kirish
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3 text-white/50 text-xs text-center">
          {[['🛡️','Xavfsiz'],['⚡','Tez'],['🔐','Shifrlangan'],['✓','Verified']].map(([icon, label]) => (
            <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="mb-1">{icon}</div>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
