import { useTranslation } from 'react-i18next'
import { Network } from 'lucide-react'
import { EmptyState } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const Structure = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.structure_title'),
    description: t('seo.structure_desc'),
  })
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t('structure_page.title', 'Tuzilma')}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {t(
            'structure_page.desc',
            "Jamiyatning tashkiliy tuzilmasi va bo'limlar o'rtasidagi bog'liqlik."
          )}
        </p>
        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
          <EmptyState
            icon={Network}
            title={t('structure_page.notice', "Tuzilma sxemasi tez orada qo'shiladi.")}
          />
        </div>
      </div>
    </section>
  )
}

export default Structure
