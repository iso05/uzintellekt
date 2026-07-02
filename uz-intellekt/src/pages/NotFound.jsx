import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useScrollToTop from '../hooks/useScrollToTop'
import { Button } from '@/shared/ui'

const NotFound = () => {
  const { t } = useTranslation()
  useScrollToTop()
  const navigate = useNavigate()

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-20">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t('not_found.eyebrow', '404')}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t('not_found.title', 'Sahifa topilmadi')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t(
            'not_found.desc',
            "Afsuski, siz qidirgan sahifa mavjud emas yoki o'chirilgan bo'lishi mumkin."
          )}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('not_found.go_back', 'Orqaga qaytish')}
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4" />
            {t('not_found.go_home', 'Asosiy sahifaga')}
          </Button>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          {t(
            'not_found.contact_notice',
            "Agar muammo davom etayotgan bo'lsa, iltimos biz bilan bog'laning:"
          )}{' '}
          <a href="/contact" className="font-semibold text-primary hover:underline">
            {t('not_found.visit_contact', 'Aloqa sahifasiga tashrif buyuring')}
          </a>
        </div>
      </div>
    </section>
  )
}

export default NotFound
