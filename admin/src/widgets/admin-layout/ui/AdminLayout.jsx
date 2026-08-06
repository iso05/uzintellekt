import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Sidebar } from '@/widgets/sidebar'
import { Header } from '@/widgets/header'
import { Toaster, ErrorBoundary } from '@shared/ui'
import { resolveRouteMeta } from '@/config/routes'

function Breadcrumbs({ items }) {
  const navigate = useNavigate()
  if (!items?.length) return null
  return (
    <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="breadcrumb">
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${c.to}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            {last ? (
              <span className="font-medium text-foreground">{c.label}</span>
            ) : (
              <a
                href={c.to}
                onClick={(e) => {
                  e.preventDefault()
                  const stepsBack = i - (items.length - 1)
                  if (stepsBack < 0) {
                    navigate(stepsBack)
                  } else {
                    navigate(c.to)
                  }
                }}
                className="transition-colors hover:text-foreground cursor-pointer"
              >
                {c.label}
              </a>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
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
  const crumbs = rawCrumbs.map((c) => ({ ...c, label: t(c.labelKey) }))

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
          {crumbs.length > 1 && <Breadcrumbs items={crumbs} />}
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <Toaster />
    </div>
  )
}
