import { useTranslation } from 'react-i18next'

const Structure = () => {
  const { t } = useTranslation()
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
        <div className="mt-10 rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm italic text-muted-foreground">
          {t('structure_page.notice', "Tuzilma sxemasi tez orada qo'shiladi.")}
        </div>
      </div>
    </section>
  )
}

export default Structure
