import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import DesktopMenu from '../navigation/DesktopMenu'
import MobileMenu from '../navigation/MobileMenu'
import logo from '../../assets/logo/logo.webp'
const TopNavbar = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isHome) {
      // boshqa page bo‘lsa scrollni eshitmaymiz

      return
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  return (
    <header
      className={`
        fixed top-0 w-full z-50 transition-all duration-300
        ${
          scrolled || !isHome
            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-md'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="h-20 flex justify-between items-center">
          {/* LOGO */}
          <NavLink
            to="/"
            className="flex items-center gap-2 text-white font-semibold text-xl"
          >
            <img
              src={logo}
              alt="UzIntellekt logo"
              className="w-12 h-12 object-contain"
            />
            UzIntellekt
          </NavLink>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex justify-center ">
            <DesktopMenu />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* REGISTER */}
            {/* <NavLink
              to="/register"
              className="hidden lg:inline-flex px-5 py-2 rounded-xl bg-white text-purple-700 font-medium hover:bg-purple-50 transition"
            >
              Registratsiya
            </NavLink> */}

            {/* LOGIN */}
            <NavLink
              to="/login"
              className="hidden lg:inline-flex px-5 py-2 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition border border-white/40"
            >
              A'zo bo'lish/Kirish
            </NavLink>
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            {/* MOBILE */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-white text-2xl"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}

export default TopNavbar
