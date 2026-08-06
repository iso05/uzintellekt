import { useTranslation } from 'react-i18next'
import { ChevronsLeft, ChevronsRight, Menu } from 'lucide-react'
import { Button } from '@shared/ui'
import LanguageSwitcher from '@shared/ui/LanguageSwitcher'

function initialsOf(user) {
  const a = (user?.firstName || '').trim()
  const b = (user?.lastName || '').trim()
  const letters = `${a[0] || ''}${b[0] || ''}`.toUpperCase()
  return letters || (user?.username || 'A').slice(0, 2).toUpperCase()
}

function shortNameOf(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return name || user?.username || 'Admin'
}

export default function Header({ user, collapsed, onToggleCollapse, onOpenMobile }) {
  const { t } = useTranslation()
  const initials = initialsOf(user)
  const shortName = shortNameOf(user)

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobile}
          className="lg:hidden text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t('header.menu')}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop collapse */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hidden text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
          aria-label={collapsed ? t('header.expand') : t('header.collapse')}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </Button>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />

          <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

          <div className="flex items-center gap-2 rounded-lg p-1 pr-2 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground shadow-soft">
              {initials}
            </span>
            <span className="hidden flex-col items-start leading-tight sm:flex max-w-[120px] md:max-w-[160px] text-left">
              <span className="w-full truncate text-[13px] font-semibold text-foreground" title={shortName}>{shortName}</span>
              <span className="w-full truncate text-[11px] font-medium text-muted-foreground">
                {t(`role.${(user?.role || 'ADMIN').toLowerCase()}`, { defaultValue: user?.role || 'ADMIN' })}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
