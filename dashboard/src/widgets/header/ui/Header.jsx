import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsLeft, ChevronsRight, Menu, Search, X } from 'lucide-react'
import { Button } from '@shared/ui'
import LanguageSwitcher from '@shared/ui/LanguageSwitcher'
import { ROUTES } from '@/config/routes'
import { getUserShortName, getUserInitials, getUserRoleLabel } from '@/entities/user'

export default function Header({
  user,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const initials = getUserInitials(user)
  const shortName = getUserShortName(user)
  const roleLabel = t(`user.type_${user?.userType === 'LEGAL' ? 'legal' : 'physical'}`, {
    defaultValue: getUserRoleLabel(user),
  })

  const [query, setQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileInputRef = useRef(null)

  useEffect(() => {
    if (mobileSearchOpen) mobileInputRef.current?.focus()
  }, [mobileSearchOpen])

  const submitSearch = (value) => {
    const q = value.trim()
    const url = q ? `${ROUTES.WORKS}?search=${encodeURIComponent(q)}` : ROUTES.WORKS
    setMobileSearchOpen(false)
    navigate(url)
  }

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

        {/* Search form (md+) */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch(query)
          }}
          className="relative hidden h-10 min-w-[220px] items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary/40 hover:border-primary/30 md:flex lg:min-w-[320px]"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('header.search')}
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={t('header.search')}
          />
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="relative text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label={t('header.search_btn')}
          >
            <Search className="h-5 w-5" />
          </Button>

          <LanguageSwitcher />

          <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

          <button
            type="button"
            onClick={() => navigate(ROUTES.PROFILE)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted min-w-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground shadow-soft">
              {initials}
            </span>
            <span className="hidden flex-col items-start leading-tight sm:flex max-w-[120px] md:max-w-[160px] text-left">
              <span className="w-full truncate text-[13px] font-semibold text-foreground" title={shortName}>{shortName}</span>
              <span className="w-full truncate text-[11px] font-medium text-muted-foreground" title={roleLabel}>{roleLabel}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch(query)
          }}
          className="relative flex items-center gap-2 border-t border-border bg-background px-4 py-2.5 md:hidden"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={mobileInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('header.search')}
            className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={t('header.search')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(false)}
            aria-label={t('header.close')}
            className="h-8 w-8 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}
    </header>
  )
}
