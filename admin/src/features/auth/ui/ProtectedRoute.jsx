import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertTriangle } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { useAuth } from '../model/use-auth'

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const { user, loading, authError } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-5">
        {authError ? (
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-9 py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="m-0 text-base font-bold text-destructive">{t('auth.failed')}</p>
            <p className="m-0 text-sm leading-relaxed text-foreground/70">{authError}</p>
          </div>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="m-0 text-sm text-muted-foreground">{t('auth.checking')}</p>
          </>
        )}
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return children
}
