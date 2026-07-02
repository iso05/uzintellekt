import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@shared/ui'
import { ROUTES } from '@/config/routes'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="m-0 text-6xl font-bold tracking-tight text-primary">404</p>
      <p className="m-0 text-lg font-semibold text-foreground">{t('notfound.title')}</p>
      <p className="m-0 max-w-sm text-sm text-muted-foreground">{t('notfound.description')}</p>
      <Button asChild>
        <Link to={ROUTES.DASHBOARD}>{t('notfound.back')}</Link>
      </Button>
    </div>
  )
}
