import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2, Lock, User } from 'lucide-react'
import { Button, Input, Label } from '@shared/ui'
import { ROUTES } from '@/config/routes'
import { useAuth, NotAdminError } from '@/features/auth'
import logo from '@/assets/logo/logo.svg'

export default function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const from = location.state?.from || ROUTES.DASHBOARD

  // Already signed in → skip the form.
  if (user) return <Navigate to={from} replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError(t('page.login.error_required'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof NotAdminError || err?.code === 'NOT_ADMIN') {
        setError(t('page.login.error_denied'))
      } else if (err?.status === 401 || err?.status === 400) {
        setError(t('page.login.error_invalid'))
      } else {
        setError(err?.message || t('page.login.error_generic'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border bg-card px-8 py-9 shadow-soft-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="UzIntellekt" className="h-14 w-14 object-contain" />
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-xl font-bold tracking-tight text-foreground">
              {t('page.login.title')}
            </h1>
            <p className="m-0 text-sm text-muted-foreground">{t('page.login.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">{t('page.login.username')}</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('page.login.username_ph')}
                className="pl-9"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('page.login.password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('page.login.password_ph')}
                className="pl-9"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('page.login.signing_in')}
              </>
            ) : (
              t('page.login.submit')
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
