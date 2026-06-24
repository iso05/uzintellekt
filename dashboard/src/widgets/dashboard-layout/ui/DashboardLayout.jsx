import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { Sidebar } from '@/widgets/sidebar'
import { Header } from '@/widgets/header'
import { Breadcrumbs } from '@/widgets/breadcrumbs'
import { Toaster } from '@/shared/ui'
import { resolveRouteMeta } from '@/shared/config/routes'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const { crumbs: rawCrumbs } = resolveRouteMeta(location.pathname)
  const crumbs = rawCrumbs.map((c) => ({ ...c, label: t(c.labelKey, c.label) }))

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />

      <div className="relative flex w-full min-w-0 flex-1 flex-col">
        <Header
          user={user}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[90] bg-foreground/30 backdrop-blur-sm lg:hidden"
            aria-hidden
          />
        )}

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <Breadcrumbs items={crumbs} />
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}
