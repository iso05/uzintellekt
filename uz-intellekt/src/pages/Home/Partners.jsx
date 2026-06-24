import { useTranslation } from 'react-i18next'

const partners = [
  { name: 'Haier' },
  { name: 'EA Games' },
  { name: 'EA Games' },
  { name: 'Haier' },
  { name: 'EA Games' },
  { name: 'EA Games' },
]

const Partners = () => {
  const { t } = useTranslation()
  return (
    <section id="partners" className="bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {t('partners_block.eyebrow', 'Hamkorlar')}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('partners_block.title', 'Hamkorlarimiz')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t('partners_block.subtitle', "Bizga ishonadigan tashkilotlar va hamjamiyatlar.")}
          </p>
        </div>

        <div className="mt-10 overflow-hidden">
          <div className="flex w-max animate-[partners-scroll_28s_linear_infinite] gap-6 sm:gap-10">
            {[...partners, ...partners].map((item, idx) => (
              <div
                key={idx}
                className="flex h-20 min-w-[160px] items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground"
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes partners-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}

export default Partners
