import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { EmptyState } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const Leadership = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.leadership_title'),
    description: t('seo.leadership_desc'),
  })
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t('leadership_page.title', 'Rahbariyat')}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {t(
            'leadership_page.desc',
            "Jamiyat rahbariyati, bosh direktor va asosiy mas'ul shaxslar haqida rasmiy ma'lumotlar."
          )}
        </p>
        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
          <EmptyState
            icon={Users}
            title={t('leadership_page.notice', 'Tez orada rahbariyat tarkibi joylanadi.')}
          />
        </div>
      </div>
    </section>
  )
}

export default Leadership
