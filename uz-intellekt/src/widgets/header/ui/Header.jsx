import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import { Button, LanguageSwitcher } from '@/shared/ui'
import { MobileMenu } from '@/widgets/mobile-menu'
import DesktopMenu from './DesktopMenu'
import logo from '@/assets/logo/logo.svg'

const Header = () => {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70 shadow-soft">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <img src={logo} alt="UzIntellekt" className="h-9 w-9 object-contain" />
            <span className="text-lg">UzIntellekt</span>
          </NavLink>

          <div className="hidden lg:flex">
            <DesktopMenu />
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/login" className="hidden lg:inline-flex">
              <Button size="sm">{t('nav.login_join', "A'zo bo'lish/Kirish")}</Button>
            </NavLink>
            <LanguageSwitcher />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
              aria-label="Menyu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}

export default Header
