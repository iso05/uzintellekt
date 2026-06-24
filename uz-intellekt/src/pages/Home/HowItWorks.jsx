import { useTranslation } from 'react-i18next'
import { Upload, ShieldCheck, FileText } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'

const steps = [
  {
    icon: Upload,
    titleKey: 'how_it_works.step_1.title',
    titleFallback: "O'zingiz ishongan ishni yuklang",
    descKey: 'how_it_works.step_1.desc',
    descFallback: 'Intellektual mulkingizni tizimga yuklaysiz.',
  },
  {
    icon: ShieldCheck,
    titleKey: 'how_it_works.step_2.title',
    titleFallback: "Ma'lumotlar tasdiqlanadi",
    descKey: 'how_it_works.step_2.desc',
    descFallback: "Yuklangan ma'lumotlar tekshiriladi.",
  },
  {
    icon: FileText,
    titleKey: 'how_it_works.step_3.title',
    titleFallback: 'Guvohnomani oling',
    descKey: 'how_it_works.step_3.desc',
    descFallback: 'Rasmiy raqamli guvohnoma olasiz.',
  },
]

const HowItWorks = () => {
  const { t } = useTranslation()
  return (
    <section id="how-it-works" className="bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {t('how_it_works.eyebrow', 'Jarayon')}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('how_it_works.title', 'Qanday ishlaydi')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t(
              'how_it_works.subtitle',
              'Uch oddiy qadamda intellektual mulkingiz himoyalanadi.'
            )}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <Card key={step.titleKey} className="relative h-full">
                <span className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft">
                  {idx + 1}
                </span>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {t(step.titleKey, step.titleFallback)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(step.descKey, step.descFallback)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
