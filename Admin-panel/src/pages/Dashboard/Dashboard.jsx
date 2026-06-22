import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Sidebar from '../../components/Sidebar/Sidebar'
import UsersList from '../Users/UsersList'
import ContractsList from '../Contracts/ContractsList'
import WorksList from '../Works/WorksList'
import CreateWork from '../Works/CreateWork'
import DashboardHome from './DashboardHome'
import './Dashboard.css'

const PAGE_TITLES = {
  overview:      { title: 'Tizim holati',          sub: 'Tizimning umumiy holatini ko\'rsatuvchi statistika va grafiklar.' },
  users:         { title: 'Foydalanuvchilar',       sub: 'Barcha ro\'yxatdan o\'tgan foydalanuvchilar.' },
  contracts:     { title: 'Shartnomalar',           sub: 'Imzolangan a\'zolik shartnomalari.' },
  works:         { title: 'Asarlar nazorati',       sub: 'Tizimdagi barcha intellektual mulk arizalari.' },
  'create-work': { title: 'Asar yaratish',          sub: "Foydalanuvchi nomidan intellektual mulkni ro'yxatdan o'tkazish." },
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"    x2="12" y2="3"/>
      <line x1="12" y1="21"   x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  )
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

const MOBILE_BREAKPOINT = 1023

export default function Dashboard({ initialPage = 'overview' }) {
  const { user } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [active,     setActive]     = useState(initialPage)
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Sync initialPage when prop changes (route change)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(initialPage)
  }, [initialPage])

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => { if (!isMobile()) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    // Always clean up on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [mobileOpen])

  // Close mobile sidebar when a nav item is clicked
  const handleNavClick = (id) => {
    setActive(id)
    if (isMobile()) setMobileOpen(false)
    navigate(`/dashboard/${id}`)
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  const page   = PAGE_TITLES[active] || PAGE_TITLES.users
  const isDark = theme === 'dark'

  return (
    <div className="dashboard-layout">

      {/* Dim backdrop on mobile when sidebar is open */}
      <div
        className={`sidebar-backdrop${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        activeItem={active}
        onNavClick={handleNavClick}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
      />

      <div className={`dashboard-main${collapsed ? ' sidebar-collapsed' : ''}`}>

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="topbar-left">

            {/* Hamburger — only visible on tablet/mobile */}
            <button
              id="hamburger-btn"
              className="hamburger-btn"
              onClick={() => setMobileOpen((o) => !o)}
              title="Toggle menu"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon />
            </button>

            <div>
              <h2>{page.title}</h2>
              <p>{page.sub}</p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Theme toggle */}
            <button
              id="topbar-theme-toggle"
              className="topbar-btn theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Light mode' : 'Dark mode'}
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="topbar-divider" aria-hidden="true"/>
            <div className="topbar-avatar" title={user?.name ?? 'Admin'}>{initials}</div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="dashboard-content">
          {active === 'overview'     && <DashboardHome />}
          {active === 'users'        && <UsersList />}
          {active === 'contracts'    && <ContractsList />}
          {active === 'works'        && <WorksList />}
          {active === 'create-work'  && <CreateWork />}
        </main>
      </div>
    </div>
  )
}
