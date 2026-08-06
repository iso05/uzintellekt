import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const Board = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.board_title'),
    description: t('seo.board_desc'),
  })
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t('board_page.title', 'Kuzatuv kengashi')}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {t(
            'board_page.desc',
            "Jamiyat faoliyati ustidan nazorat qiluvchi Kuzatuv kengashi a'zolari va ularning vakolatlari."
          )}
        </p>
        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
          <EmptyState
            icon={ShieldCheck}
            title={t('board_page.notice', "Kuzatuv kengashi tarkibi tez orada e'lon qilinadi.")}
          />
        </div>
      </div>
    </section>
  )
}

export default Board
