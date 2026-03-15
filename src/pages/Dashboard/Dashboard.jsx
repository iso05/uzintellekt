import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { id: 1, icon: '🏠', label: 'Bosh sahifa', path: '/' },
    { id: 2, icon: '📄', label: 'Hujjatlar', path: '#' },
    { id: 3, icon: '📊', label: 'Tariflar', path: '#' },
    { id: 4, icon: '💼', label: 'Xizmatlar', path: '#' },
    { id: 5, icon: '👤', label: 'Profil', path: '#' },
    { id: 6, icon: '⚙️', label: 'Sozlamalar', path: '#' },
    { id: 7, icon: '❓', label: 'Yordam', path: '#' },
  ]

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_address_data')

    if (!token) {
      navigate('/login')
      return
    }

    // Simulate loading user data
    setTimeout(() => {
      if (userData) {
        setUser(JSON.parse(userData))
      }
      setLoading(false)
    }, 500)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_address_data')
    navigate('/login')
  }

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <p className="text-slate-600 text-lg">Yuklanyapti...</p>
        </div>
      </section>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <div
        className={`fixed md:relative h-screen bg-white border-r border-slate-200 shadow-lg transition-all duration-300 z-20 ${
          sidebarOpen ? 'w-64 md:w-56' : 'w-20'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
              <span className="font-bold text-slate-900 text-sm">
                UzIntellekt
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title={sidebarOpen ? 'Yopish' : 'Ochish'}
          >
            {sidebarOpen ? (
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                sidebarOpen
                  ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  : 'hover:bg-slate-100 justify-center'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 font-medium text-sm ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title={!sidebarOpen ? 'Chiqish' : ''}
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="whitespace-nowrap">Chiqish</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
              U
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* WELCOME SECTION */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Xush kelibsiz! 👋
              </h2>
              <p className="text-slate-600">
                Siz muvaffaqiyatli ro'yxatdan o'tdingiz va platformaning barcha
                xizmatlaridan foydalanishingiz mumkin.
              </p>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-slate-600 text-sm font-medium">Hujjatlar</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-slate-600 text-sm font-medium">
                  Tasdiqlangan
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-slate-600 text-sm font-medium">Kutayotgan</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-slate-600 text-sm font-medium">Saldo</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">$0</p>
              </div>
            </div>

            {/* USER INFORMATION */}
            {user && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  📋 Sizning Ma'lumotlaringiz
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-2">
                      Asosiy Telefon
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {user.phoneRequired}
                    </p>
                  </div>
                  {user.phoneOptional && (
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-2">
                        Ikinchi Telefon
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {user.phoneOptional}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-2">
                      Ko'cha
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {user.street}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-2">
                      Uy / Xona Raqami
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {user.houseNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                🚀 Tezkor Harakatlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-left group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    📄
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Hujjat Yuklash
                  </p>
                </button>
                <button className="p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Tariflar
                  </p>
                </button>
                <button className="p-4 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    💼
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Xizmatlar
                  </p>
                </button>
                <button className="p-4 rounded-lg border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-left group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    ⚙️
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Sozlamalar
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
