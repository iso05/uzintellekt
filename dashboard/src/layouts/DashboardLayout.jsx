import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo/logo.png'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Close mobile sidebar on route change automatically
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const initials = user?.userType === 'LEGAL'
    ? (user?.legalName?.[0] || '?').toUpperCase()
    : [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  const getPageTitle = () => {
    const p = location.pathname
    if (p === '/') return 'Asosiy'
    if (p === '/profile') return 'Profil'
    if (p === '/works') return 'Asarlarim'
    if (p === '/works/new') return 'Yangi asar'
    if (p.startsWith('/works/') && p.endsWith('/edit')) return 'Asarni tahrirlash'
    if (p === '/contracts') return 'Shartnomalarim'
    if (p === '/admin/works') return 'Asarlar nazorati'
    if (p.startsWith('/admin/works/') && p.endsWith('/edit')) return 'Asarni tahrirlash (Admin)'
    return 'Dashboard'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F5F9', display: 'flex', color: '#1E2A3B' }}>
      <style>{STYLE_CSS}</style>

      {/* Sidebar */}
      <aside 
        style={{ 
          width: isSidebarCollapsed ? '80px' : '240px', 
          backgroundColor: '#2C4F8A', 
          height: '100vh', 
          position: 'sticky', 
          top: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          zIndex: 50
        }}
        className={isMobileMenuOpen ? 'mobile-sidebar-open' : 'mobile-sidebar-closed'}
      >
        {/* Sidebar Header */}
        <div style={{ height: '64px', backgroundColor: '#244376', borderBottom: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', boxSizing: 'border-box' }} className="shrink-0 overflow-hidden">
          <div className="flex items-center gap-3">
            <a href='https://uzintellekt.uz'><img src={logo} alt="Uzintellekt Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} className="shrink-0" /></a>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <a href='https://uzintellekt.uz' style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: 700, lineHeight: 1.2 }}>
                    UzIntellekt
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: '11px', fontWeight: 400, marginTop: '2px' }}>
                    Intellektual Mulk
                  </span>
                </div>
              </a>
            )}
          </div>
          {/* Close Sidebar button for Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
            className="gov-mobile-only"
          >
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

          {/* Asosiy */}
          <NavLink to="/" title="Asosiy" end
            className={({isActive}) => `gov-nav-link ${isActive ? 'gov-nav-link-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {!isSidebarCollapsed && <span>Asosiy</span>}
          </NavLink>

          {/* Asarlarim */}
          <NavLink to="/works" title="Asarlarim"
            className={({isActive}) => `gov-nav-link ${isActive ? 'gov-nav-link-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {!isSidebarCollapsed && <span>Asarlarim</span>}
          </NavLink>

          {/* Shartnomalarim */}
          <NavLink to="/contracts" title="Shartnomalarim"
            className={({isActive}) => `gov-nav-link ${isActive ? 'gov-nav-link-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {!isSidebarCollapsed && <span>Shartnomalarim</span>}
          </NavLink>

          {/* Profil */}
          <NavLink to="/profile" title="Profil"
            className={({isActive}) => `gov-nav-link ${isActive ? 'gov-nav-link-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {!isSidebarCollapsed && <span>Profil</span>}
          </NavLink>

          {/* Asarlar nazorati (Admin only) */}
          {(user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?._isTestMode) && (
            <NavLink to="/admin/works" title="Asarlar nazorati"
              className={({isActive}) => `gov-nav-link ${isActive ? 'gov-nav-link-active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              {(!isSidebarCollapsed || isMobileMenuOpen) && <span>Asarlar nazorati</span>}
            </NavLink>
          )}

        </nav>

        {/* Sidebar Footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.10)', padding: '16px 18px' }} className="shrink-0">
          <button 
            onClick={logout}
            title="Chiqish"
            className="gov-logout-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', outline: 'none' }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {!isSidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 600 }}>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', width: '100%' }}>
        
        {/* Top Header */}
        <header style={{ height: '56px', backgroundColor: '#FFFFFF', borderBottom: '2px solid #2C4F8A', boxShadow: '0 1px 4px rgba(44,79,138,0.08)', position: 'sticky', top: 0, zIndex: 30, padding: '0 28px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ width: '36px', height: '36px', borderRadius: '4px', border: '1px solid #DDE2EC', background: '#FFFFFF', cursor: 'pointer', color: '#2C4F8A' }}
              className="gov-desktop-only"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                )}
              </svg>
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ width: '36px', height: '36px', borderRadius: '4px', border: '1px solid #DDE2EC', background: '#FFFFFF', cursor: 'pointer', color: '#2C4F8A' }}
              className="gov-mobile-only"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </button>
            
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2C4F8A', margin: 0 }} className="tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* User Profile Badge in Header */}
            <div 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2C4F8A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="hidden sm:flex">
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E2A3B', lineHeight: 1.2 }}>
                  {user?.userType === 'LEGAL'
                    ? user?.legalName
                    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Foydalanuvchi'}
                </span>
                <span style={{ backgroundColor: '#EEF2FB', color: '#2C4F8A', border: '1px solid #B0C0DE', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '3px', letterSpacing: '0.3px', textTransform: 'uppercase', marginTop: '2px' }}>
                  {user?.userType === 'LEGAL' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(30, 42, 59, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 90,
            }}
            className="gov-mobile-overlay"
          />
        )}

        {/* Breadcrumb Bar */}
        <div style={{ height: '34px', backgroundColor: '#EDF0F7', borderBottom: '1px solid #DDE2EC', display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: '12px', color: '#6B7A8D', boxSizing: 'border-box' }} className="shrink-0">
          {(() => {
            const p = location.pathname
            const parts = [{ label: 'Bosh sahifa', link: '/', isLast: p === '/' }]
            if (p === '/profile') {
              parts.push({ label: 'Profil', link: '/profile', isLast: true })
            } else if (p === '/works') {
              parts.push({ label: 'Asarlar', link: '/works', isLast: true })
            } else if (p === '/works/new') {
              parts.push({ label: 'Asarlar', link: '/works', isLast: false })
              parts.push({ label: 'Yangi asar', link: '/works/new', isLast: true })
            } else if (p.startsWith('/works/') && p.endsWith('/edit')) {
              parts.push({ label: 'Asarlar', link: '/works', isLast: false })
              parts.push({ label: 'Tahrirlash', link: p, isLast: true })
            } else if (p === '/contracts') {
              parts.push({ label: 'Shartnomalarim', link: '/contracts', isLast: true })
            } else if (p === '/admin/works') {
              parts.push({ label: 'Nazorat', link: '/admin/works', isLast: true })
            } else if (p.startsWith('/admin/works/') && p.endsWith('/edit')) {
              parts.push({ label: 'Nazorat', link: '/admin/works', isLast: false })
              parts.push({ label: 'Tahrirlash', link: p, isLast: true })
            }
            return parts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ margin: '0 8px' }}>/</span>}
                <span style={{ color: part.isLast ? '#2C4F8A' : '#6B7A8D', fontWeight: part.isLast ? 600 : 400 }}>
                  {part.label}
                </span>
              </React.Fragment>
            ))
          })()}
        </div>

        {/* Page Content */}
        <main style={{ padding: '24px 28px', maxWidth: '960px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }} className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const STYLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif !important;
  background-color: #F3F5F9 !important;
  margin: 0;
  color: #1E2A3B;
}

.gov-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px !important;
  color: rgba(255,255,255,0.70) !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  border-left: 3px solid transparent !important;
  transition: all 0.12s ease-in-out !important;
  text-decoration: none !important;
  border-radius: 0px !important;
  margin: 0 !important;
}

.gov-nav-link:hover {
  background-color: rgba(255,255,255,0.08) !important;
  color: #FFFFFF !important;
  border-left: 3px solid rgba(255,255,255,0.25) !important;
}

.gov-nav-link-active {
  background-color: rgba(255,255,255,0.14) !important;
  color: #FFFFFF !important;
  border-left: 3px solid #F0C040 !important;
  font-weight: 600 !important;
}

.gov-logout-btn {
  color: #F4A0A0 !important;
  transition: all 0.12s ease-in-out;
}

.gov-logout-btn:hover {
  color: #FF7070 !important;
  background-color: rgba(255,80,80,0.08) !important;
  border-radius: 4px;
}

.gov-desktop-only {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.gov-mobile-only {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1024px) {
  .gov-desktop-only {
    display: none !important;
  }
  
  aside {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    height: 100vh !important;
    width: 240px !important;
    transform: translateX(-100%) !important;
    transition: transform 0.25s ease-in-out !important;
    z-index: 100 !important;
  }
  
  aside.mobile-sidebar-open {
    transform: translateX(0) !important;
  }
  
  aside.mobile-sidebar-closed {
    transform: translateX(-100%) !important;
  }
}

@media (min-width: 1025px) {
  .gov-mobile-only {
    display: none !important;
  }
  .gov-mobile-overlay {
    display: none !important;
  }
}
`
