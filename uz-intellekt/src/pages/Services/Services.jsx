import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  FileBadge,
  FileText,
  Gavel,
  HelpCircle,
  Lock,
  Medal,
  Music,
  Palette,
  PenTool,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react'
import { Button, Card, CardContent } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const services = [
  {
    id: 1,
    icon: Briefcase,
    name: 'Deponentlash',
    desc: "Intellektual mulkingizni rasmiy ravishda ro'yxatdan o'tkazing",
    features: ['Rasmiy sana tasdiqi', 'Raqamli guvohnoma', 'Huquqiy kuchga ega', 'Xavfsiz saqlash'],
    highlight: true,
  },
  {
    id: 2,
    icon: ClipboardList,
    name: 'Qaydnoma hizmati',
    desc: 'Asarlaringizni platformada baholang va reyting olasiz',
    features: ['Asarni qayd etish', 'Reyting tizimi', 'Detaliy xulosa', 'Sertifikat'],
  },
  {
    id: 3,
    icon: Scale,
    name: 'Huquqiy maslahati',
    desc: "Intellektual mulk huquqlari bo'yicha mutaxassislar bilan muloqot",
    features: ['Onlayn maslaha', 'Hujjatlar tahlili', 'Huquq himoyasi', 'Nizolarni hal etish'],
  },
  {
    id: 4,
    icon: FileBadge,
    name: 'Litsenziyalash',
    desc: 'Asarlaringiz uchun litsenziyaviy shartlar yarating va daromad oling',
    features: ['Litsenziya shartlari', "To'lov tizimi", 'Monitoring', 'Hisobot'],
  },
]

const providedWorks = [
  { icon: BookOpen, category: 'Matnli asarlar', key: 'text', items: ['Kitoblar', 'Dissertatsiyalar', 'Maqolalar', 'Loyihalar', 'Taqdimotlar'] },
  { icon: Music, category: 'Audio va musiqa', key: 'music', items: ['Kuylar', 'Vokal traklari', 'Arranjirovkalar', 'Podcast', 'Remikslari'] },
  { icon: Palette, category: 'Vizual ijodiyot', key: 'visual', items: ['Rasmlar', 'Ilustratsiyalar', 'Dizayn loyal', 'Fotografiyalar', 'Logolar'] },
  { icon: PenTool, category: 'Texnik asarlar', key: 'tech', items: ['Dasturiy kod', 'Veb-saytlar', 'Mobilka', "API'lar", 'Elektron kurstalar'] },
  { icon: Video, category: 'Mediya kontenti', key: 'media', items: ['Videolar', 'Animasiyalar', 'Dokumentlar', 'Kompilatsiyalar', 'Trailerlar'] },
  { icon: Trophy, category: 'Boshqa solalar', key: 'other', items: ['Ixtirolar', 'Rasm naqshlari', 'Arxitektura', 'Joriy va tarixiy', 'Tarkibiy noyalar'] },
]

const processSteps = [
  { number: '01', title: "Ro'yxatdan o'tish", desc: "Platformada profil yarating va asosiy ma'lumotlarni kiriting" },
  { number: '02', title: 'Asarni yuklash', desc: 'Asarning fayl yoki tasvirini platformaga yuklaysiz' },
  { number: '03', title: "Ma'lumotlarni to'ldirish", desc: "Asar haqida batafsil ma'lumotlar kiriting" },
  { number: '04', title: 'Tekshiruv', desc: "Mutaxassislar tomonidan ma'lumotlar tasdiqlanadi (1-3 kun)" },
  { number: '05', title: "To'lov", desc: "Deponentlash haqini to'lasiz" },
  { number: '06', title: 'Guvohnoma olish', desc: 'Rasmiy raqamli guvohnomani email orqali olasiz' },
]

const benefits = [
  { icon: ShieldCheck, title: 'Huquqiy himoya', desc: "Asarlaringiz qonuniy hovuzda to'la himoya qilinadi" },
  { icon: Medal, title: 'Raqamli guvohnoma', desc: 'QR-kod va verifikatsiyali yuqori darajadagi hujjat' },
  { icon: Lock, title: 'Xavfsiz saqlash', desc: 'Shifrlangan serverlar va 24/7 monitoring' },
  { icon: BarChart3, title: "Biznesingizni o'stiring", desc: "Asarlarni litsenziyalang va qo'shimcha daromad oling" },
  { icon: Sparkles, title: 'Professional tahlil', desc: 'Mutaxassislar tomonidan batafsil baholash va tavsiyalar' },
  { icon: Gavel, title: "Davlatning tan'olishi", desc: "Qonuniy sharoitda to'la e'tirof etilgan raqamli guvohnoma" },
]

const featureMap = {
  'Rasmiy sana tasdiqi': { ns: 'depositing_page.bullet_1' },
  'Raqamli guvohnoma': { ns: 'depositing_page.bullet_2' },
  'Huquqiy kuchga ega': { ns: 'depositing_page.bullet_4' },
  'Xavfsiz saqlash': { ns: 'depositing_page.bullet_3' },
  'Asarni qayd etish': { key: 'book' },
  'Reyting tizimi': { key: 'mob' },
  'Detaliy xulosa': { key: 'proj' },
  Sertifikat: { key: 'logo' },
  'Onlayn maslaha': { key: 'pres' },
  'Hujjatlar tahlili': { key: 'doc' },
  'Huquq himoyasi': { key: 'inv' },
  'Nizolarni hal etish': { key: 'idea' },
  'Litsenziya shartlari': { key: 'pattern' },
  "To'lov tizimi": { key: 'trail' },
  Monitoring: { key: 'photo' },
  Hisobot: { key: 'api' },
}

const itemKeyMap = {
  Kitoblar: 'book', Dissertatsiyalar: 'diss', Maqolalar: 'art', Loyihalar: 'proj', Taqdimotlar: 'pres',
  Kuylar: 'tune', 'Vokal traklari': 'vocal', Arranjirovkalar: 'arr', Podcast: 'pod', Remikslari: 'remix',
  Rasmlar: 'pic', Ilustratsiyalar: 'ill', 'Dizayn loyal': 'design', Fotografiyalar: 'photo', Logolar: 'logo',
  'Dasturiy kod': 'code', 'Veb-saytlar': 'site', Mobilka: 'mob', "API'lar": 'api', 'Elektron kurstalar': 'course',
  Videolar: 'video', Animasiyalar: 'anim', Dokumentlar: 'doc', Kompilatsiyalar: 'comp', Trailerlar: 'trail',
  Ixtirolar: 'inv', 'Rasm naqshlari': 'pattern', Arxitektura: 'arch', 'Joriy va tarixiy': 'history', 'Tarkibiy noyalar': 'idea',
}

const Services = () => {
  const { t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#registration-guide' || location.state?.scrollToGuide) {
      const timer = setTimeout(() => {
        const el = document.getElementById('registration-guide')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location])

  useSEO({
    title: t('seo.services_title'),
    description: t('seo.services_desc'),
  })

  const tFeature = (feature) => {
    const cfg = featureMap[feature]
    if (!cfg) return feature
    return cfg.ns ? t(cfg.ns, feature) : t(`services_page.items.${cfg.key}`, feature)
  }

  return (
    <main className="bg-background">
      {/* HERO */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                {t('services_page.hero_title', 'Intellektual mulkingizni himoya qiling')}
              </h1>
              <p className="mt-5 max-w-xl leading-relaxed text-primary-foreground/85">
                {t(
                  'services_page.hero_desc',
                  "Biz siz uchun eng sodda, eng tez va eng xavfsiz deponentlash xizmati taqdim etamiz."
                )}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <NavLink to="/login">
                  <Button size="lg" variant="secondary">
                    {t('services_page.start_btn', 'Boshlash')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </NavLink>
                <NavLink to="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    {t('services_page.details_btn', "Batafsil ma'lumot")}
                  </Button>
                </NavLink>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-6">
                <Stat value="10K+" label={t('services_page.users', 'Foydalanuvchilar')} />
                <Stat value="50K+" label={t('services_page.deposited_works', 'Asarlar')} />
                <Stat value="24/7" label={t('services_page.support_24_7', "Xizmat ko'rsatish")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniTile icon={FileText} label={t('services_page.upload_title', 'Asarni yuklash')} />
              <MiniTile icon={CheckCircle} label={t('services_page.review_title', 'Tekshiruv')} />
              <MiniTile icon={Medal} label={t('services_page.cert_title', 'Guvohnoma')} />
              <MiniTile icon={Lock} label={t('services_page.security_title', 'Himoya')} />
              <div className="col-span-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 text-sm">
                <strong>{t('services_page.fast_badge', 'Tez: 1-3 kun ichida guvohnoma oling')}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {t('services_page.grid_title', 'Bizning xizmatlarimiz')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t(
                'services_page.grid_subtitle',
                "Intellektual mulkni himoya qilish va o'stirish uchun to'liq yechim"
              )}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon
              const highlighted = service.highlight
              return (
                <Card
                  key={service.id}
                  className={`h-full transition-all hover:-translate-y-1 hover:shadow-soft-md ${
                    highlighted ? 'border-0 bg-primary text-primary-foreground shadow-soft-md' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                        highlighted
                          ? 'bg-primary-foreground/15 text-primary-foreground'
                          : 'bg-primary-soft text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                      {t(`services_page.packages.p${service.id}_name`, service.name)}
                    </h3>
                    <p
                      className={`mt-1.5 text-sm leading-relaxed ${
                        highlighted ? 'text-primary-foreground/85' : 'text-muted-foreground'
                      }`}
                    >
                      {t(`services_page.packages.p${service.id}_desc`, service.desc)}
                    </p>
                    <ul className="mt-4 space-y-1.5 text-sm">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className={`flex items-center gap-2 ${
                            highlighted ? 'text-primary-foreground/85' : 'text-foreground/80'
                          }`}
                        >
                          <Check className="h-4 w-4 shrink-0" />
                          {tFeature(feature)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHAT WE ACCEPT */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {t('services_page.accept_title', 'Qanday asarlarni qabul qilamiz?')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t(
                'services_page.accept_subtitle',
                'Har qanday soha, har qanday tipdagi intellektual mulk'
              )}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {providedWorks.map((work) => {
              const Icon = work.icon
              return (
                <Card key={work.key} className="transition-colors hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {t(`services_page.cats.${work.key}`, work.category)}
                      </h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {work.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {t(`services_page.items.${itemKeyMap[item] || item}`, item)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {t('services_page.step_title', '6 qadamda deponentlang')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('services_page.step_subtitle', 'Sodda, tez va tushunarli jarayon')}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {processSteps.map((step, idx) => {
              const stepKey = `step_${idx + 1}`
              return (
                <Card key={step.number} className="relative h-full">
                  <span className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft">
                    {step.number}
                  </span>
                  <CardContent className="p-6">
                    <h3 className="mt-2 text-base font-semibold text-foreground">
                      {t(`services_page.${stepKey}`, step.title)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`services_page.${stepKey}_desc`, step.desc)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            {t('services_page.total_time', 'Umumiy vaqt: 3-5 kun')}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {t('services_page.why_title', 'Nima uchun bizni tanlaysiz?')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('services_page.why_subtitle', "6 ta asosiy manfa'at va imkoniyatlar")}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.title} className="transition-all hover:-translate-y-1 hover:shadow-soft-md">
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {t(`services_page.benefits.b${idx + 1}_title`, benefit.title)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`services_page.benefits.b${idx + 1}_desc`, benefit.desc)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('services_page.cta_title', 'Asaringizni bugunoq himoya qiling')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85">
            {t(
              'services_page.cta_subtitle',
              'Minglab mutaxassislar va ijodkorlar asarlarini bizga ishonmoqdalar.'
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <NavLink to="/login">
              <Button size="lg" variant="secondary">
                {t('services_page.cta_btn', 'Boshlang')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </NavLink>
            <NavLink to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t('services_page.faq_btn', 'Savollar berish')}
              </Button>
            </NavLink>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/70">
            {t(
              'services_page.cta_no_card',
              "Kredit kartasiz ro'yxatdan o'tish. Barcha ma'lumotlar shifrlangan."
            )}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('services_page.faq_title', "Tez-tez so'raladigan savollar")}
          </h2>
          <div className="mt-10 space-y-4">
            {[
              {
                q: t('services_page.faq_q1', 'Deponentlash qanchalik uzoq vaqt oladi?'),
                a: t('services_page.faq_a1', 'Odatda 1-3 kun.'),
              },
              {
                q: t('services_page.faq_q2', "Mening asarlarini boshqalar ko'rishi mumkinmi?"),
                a: t('services_page.faq_a2', "Yo'q. Barcha ma'lumotlar shifrlangan."),
              },
              {
                q: t('services_page.faq_q3', 'Guvohnomaning huquqiy kuchi qancha?'),
                a: t('services_page.faq_a3', "O'zbekistonda to'la qonuniy kuchga ega."),
              },
              {
                q: t('services_page.faq_q4', 'Nechta asarni deponentlash mumkin?'),
                a: t('services_page.faq_a4', 'Cheksiz.'),
              },
            ].map((item) => (
              <Card key={item.q} className="transition-colors hover:border-primary/30">
                <CardContent className="p-5">
                  <h3 className="flex items-start gap-2 text-base font-semibold text-foreground">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {item.q}
                  </h3>
                  <p className="ml-7 mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <NavLink
              to="/contact"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t('services_page.more_faq', "Ko'proq savol-javoblar")}
              <ArrowRight className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* REGISTRATION GUIDE (YOUTUBE VIDEO) */}
      <section id="registration-guide" className="bg-background py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {t('services_page.video_guide_title', "Ro'yxatdan o'tish qo'llanmasi")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t(
                'services_page.video_guide_subtitle',
                "Platformada ro'yxatdan o'tish va xizmatlardan foydalanish bo'yicha batafsil video qo'llanma"
              )}
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-border shadow-soft-lg bg-black aspect-video">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/0n1cJ0KMQjM"
              title={t('services_page.video_guide_title', "Ro'yxatdan o'tish qo'llanmasi")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </main>
  )
}

const Stat = ({ value, label }) => (
  <div>
    <p className="text-3xl font-extrabold">{value}</p>
    <p className="mt-0.5 text-xs text-primary-foreground/80">{label}</p>
  </div>
)

const MiniTile = ({ icon: Icon, label }) => (
  <div className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
    <Icon className="h-5 w-5" />
    <p className="mt-2 text-sm font-semibold">{label}</p>
  </div>
)

export default Services
