import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, FileBadge, Lock, ShieldCheck } from 'lucide-react'
import { Button, Card, CardContent } from '@/shared/ui'

const features = [
  {
    icon: ShieldCheck,
    title: 'Huquqiy isbot',
    desc: "Asaringizni aniq sana va muallif bilan rasmiy ro'yxatdan o'tkazish orqali huquqiy isbotga ega bo'lasiz.",
  },
  {
    icon: FileBadge,
    title: 'Raqamli guvohnoma',
    desc: 'Deponentlash yakunida QR-kodli va verifikatsiya qilinadigan raqamli guvohnoma beriladi.',
  },
  {
    icon: Lock,
    title: 'Xavfsiz saqlash',
    desc: 'Asarlaringiz shifrlangan holda xavfsiz serverlarda saqlanadi.',
  },
]

const acceptedWorks = [
  'Matnli asarlar (kitob, maqola, dissertatsiya)',
  'Musiqa va audio asarlar',
  'Dizayn, rasm, ilustratsiyalar',
  'Dasturiy kod va IT mahsulotlar',
  'Video va media mahsulotlar',
]

const steps = [
  { step: '01', title: 'Asarni yuklash', desc: "Asaringizni platformaga yuklaysiz va asosiy ma'lumotlarni to'ldirasiz." },
  { step: '02', title: 'Tekshiruv', desc: "Mutaxassislar tomonidan ma'lumotlar tekshiriladi." },
  { step: '03', title: 'Guvohnoma berish', desc: 'Rasmiy raqamli deponentlash guvohnomasini olasiz.' },
]

const Depositing = () => {
  const { t } = useTranslation()
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* HERO */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('depositing_page.title', 'Deponentlash xizmati')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t(
                'depositing_page.desc',
                "Intellektual mulk obyektlarini rasmiy ravishda ro'yxatdan o'tkazing, huquqlaringizni mustahkamlang va kelajakdagi nizolardan himoyalaning."
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <NavLink to="/login">
                <Button size="lg">
                  {t('depositing_page.start_btn', 'Deponentlashni boshlash')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </NavLink>
              <NavLink to="/contact">
                <Button size="lg" variant="outline">
                  {t('depositing_page.ask_btn', 'Savol berish')}
                </Button>
              </NavLink>
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              <ul className="space-y-3 text-sm text-foreground">
                {[
                  t('depositing_page.bullet_1', 'Rasmiy sana va mualliflik tasdiqi'),
                  t('depositing_page.bullet_2', 'Raqamli guvohnoma'),
                  t('depositing_page.bullet_3', 'Xavfsiz saqlash'),
                  t('depositing_page.bullet_4', 'Huquqiy kuchga ega hujjat'),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* WHY */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('depositing_page.why_title', 'Nima uchun deponentlash muhim?')}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((item, idx) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="transition-all hover:-translate-y-1 hover:shadow-soft-md">
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {t(`depositing_page.features.f${idx + 1}_title`, item.title)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`depositing_page.features.f${idx + 1}_desc`, item.desc)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* HOW */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('depositing_page.how_title', 'Qanday ishlaydi?')}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((item, idx) => (
              <Card key={item.step} className="relative">
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wide text-primary-foreground shadow-soft">
                  {item.step}
                </span>
                <CardContent className="p-6">
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {t(`depositing_page.steps.s${idx + 1}_title`, item.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`depositing_page.steps.s${idx + 1}_desc`, item.desc)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ACCEPTED */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('depositing_page.works_title', 'Qanday asarlar qabul qilinadi?')}
          </h2>
          <Card className="mt-8">
            <CardContent className="p-8">
              <ul className="grid grid-cols-1 gap-3 text-sm text-foreground sm:grid-cols-2">
                {acceptedWorks.map((item, idx) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {t(`depositing_page.accepted.${idx}`, item)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('depositing_page.cta_title', 'Asaringizni bugunoq himoyalang')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t(
              'depositing_page.cta_desc',
              "Deponentlash — bu faqat hujjat emas, bu sizning intellektual mulkingizga bo'lgan huquqingizni himoya qilishdir."
            )}
          </p>
          <NavLink to="/login" className="mt-8 inline-block">
            <Button size="lg">
              {t('depositing_page.cta_btn', 'Deponentlashni boshlash')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </NavLink>
        </div>
      </div>
    </section>
  )
}

export default Depositing
