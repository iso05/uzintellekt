import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, X } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { NAV_ITEMS, ROUTES } from '@/config/routes'
import logo from '@/assets/logo/logo.svg'

import { usePendingConsentCount } from '@/entities/work'

function NavItem({ item, collapsed, pendingCount = 0 }) {
  const { t } = useTranslation()
  const Icon = item.icon
  const label = t(`nav.${item.key}`)
  const isWorks = item.to === ROUTES.WORKS || item.key === 'works'

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      title={label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          isActive && 'bg-primary-soft text-primary-soft-foreground font-semibold shadow-soft',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <div className="relative flex items-center justify-center shrink-0">
            <Icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            {isWorks && collapsed && pendingCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && isWorks && pendingCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground animate-pulse shadow-soft">
              {pendingCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label} {pendingCount > 0 ? `(${pendingCount})` : ''}
      </TooltipContent>
    </Tooltip>
  )
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) {
  const { t } = useTranslation()
  const { pendingCount } = usePendingConsentCount()
  const items = NAV_ITEMS
  const isCompact = collapsed && !mobileOpen

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-[76px]' : 'w-[248px]',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:h-screen max-lg:w-[260px] max-lg:z-[100] max-lg:shadow-soft-lg max-lg:transition-transform max-lg:duration-300',
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className={cn(
          'flex h-16 shrink-0 items-center border-b border-border px-4',
          isCompact && 'justify-center px-2'
        )}>
          <Link to={ROUTES.DASHBOARD} className="flex min-w-0 items-center gap-2.5">
            <img src={logo} alt="UzIntellekt" className="h-9 w-9 shrink-0 object-contain" />
            {!isCompact && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="text-[15px] font-bold tracking-tight text-foreground">UzIntellekt</span>
                <span className="text-[11px] font-medium text-muted-foreground">Intellektual mulk</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            aria-label={t('header.close')}
            className="ml-auto text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-3">
          {!isCompact && (
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t('nav.menu')}
            </p>
          )}
          {items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={isCompact} pendingCount={pendingCount} />
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto shrink-0 border-t border-border p-3">
          <Button
            variant="ghost"
            onClick={onLogout}
            title={t('nav.logout')}
            className={cn(
              'w-full justify-start gap-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive',
              isCompact && 'justify-center'
            )}
          >
            <LogOut className="!h-5 !w-5 shrink-0" />
            {!isCompact && <span className="font-medium">{t('nav.logout')}</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
