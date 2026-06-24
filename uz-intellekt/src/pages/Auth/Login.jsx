import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Lock, ShieldAlert, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import useScrollToTop from '../../hooks/useScrollToTop'
import { cleanURLHistory, isValidAuthCode, sanitizeErrorMessage } from '../../utils/securityUtils'
import { Button, Card, CardContent } from '@/shared/ui'

export default function Login() {
  useScrollToTop()

  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { user, loading, loginWithOneId, handleCallback } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const callbackProcessed = useRef(false)

  const DASHBOARD_URL =
    import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.uzintellekt.uz'

  useEffect(() => {
    const hasCode = Boolean(searchParams.get('code'))
    if (!loading && user && !hasCode) {
      if (user.isMember) {
        window.location.replace(DASHBOARD_URL)
      } else {
        navigate('/register', { replace: true })
      }
    }
  }, [loading, user, searchParams, navigate])

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(t('login_page.err_oneid', 'OneID orqali kirishda xatolik: ') + errorParam)
      return
    }
    if (!code) return

    if (!isValidAuthCode(code)) {
      setError(
        t('login_page.err_invalid_code', "OneID orqali olingan kod formati noto'g'ri.")
      )
      return
    }

    if (callbackProcessed.current) return
    callbackProcessed.current = true

    cleanURLHistory('/login')
    setIsLoading(true)
    setError(null)

    handleCallback(code, state)
      .then(({ isMember }) => {
        setIsLoading(false)
        if (isMember) {
          window.location.replace(DASHBOARD_URL)
        } else {
          navigate('/register', { replace: true })
        }
      })
      .catch((err) => {
        setError(
          sanitizeErrorMessage(
            err.message ||
              t('login_page.err_fallback', 'Xatolik yuz berdi. Qayta urining.')
          )
        )
        setIsLoading(false)
        callbackProcessed.current = false
      })
  }, [searchParams, handleCallback, navigate, t])

  const handleLoginClick = () => {
    setError(null)
    loginWithOneId()
  }

  const badges = [
    { icon: ShieldCheck, label: t('login_page.badge_secure', 'Xavfsiz') },
    { icon: Zap, label: t('login_page.badge_fast', 'Tez') },
    { icon: Lock, label: t('login_page.badge_encrypted', 'Shifrlangan') },
    { icon: ShieldCheck, label: t('login_page.badge_verified', 'Verified') },
  ]

  const isBusy = loading || isLoading

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-8 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Lock className="h-7 w-7" />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {isBusy
                  ? t('login_page.title_checking', 'Tekshirilmoqda...')
                  : t('login_page.title_welcome', 'Xush kelibsiz')}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t('login_page.subtitle', 'uzintellekt.uz platformasiga kirish')}
              </p>
            </div>

            {isBusy && (
              <div className="flex flex-col items-center gap-3 py-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? t('login_page.oneid_loading', 'OneID orqali autentifikatsiya...')
                    : t('login_page.checking_session', 'Avtorizatsiya tekshirilmoqda...')}
                </p>
              </div>
            )}

            {error && !isBusy && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isBusy && (
              <>
                <Button onClick={handleLoginClick} size="lg" className="w-full">
                  <Lock className="h-4 w-4" />
                  {t('login_page.btn_oneid', 'OneID bilan kirish')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t(
                    'login_page.hint',
                    "O'zbekiston Davlat xizmatlari — id.egov.uz orqali xavfsiz kirish"
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
