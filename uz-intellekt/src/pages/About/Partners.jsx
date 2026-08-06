import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Button, Card, CardContent, Eyebrow, HeroChip } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const partners = [
  {
    name: 'Intellektual mulk agentligi',
    desc: "Intellektual mulkni huquqiy himoyalash bo'yicha davlat tashkiloti.",
    tag: 'Davlat tashkiloti',
  },
  {
    name: "Oliy ta'lim vazirligi",
    desc: "Ilmiy va ta'lim muassasalari bilan hamkorlik.",
    tag: "Ta'lim",
  },
  {
    name: 'Raqamli texnologiyalar markazi',
    desc: 'Platformaning texnik infratuzilmasini rivojlantirish.',
    tag: 'Texnologiya',
  },
  {
    name: 'Xalqaro ekspertlar guruhi',
    desc: 'Xalqaro standartlar va konsultatsiyalar.',
    tag: 'Xalqaro',
  },
]

const stats = [
  { value: '4+', label: 'Asosiy hamkorlar' },
  { value: '12+', label: 'Loyihalar' },
  { value: '3', label: 'Xalqaro shartnoma' },
  { value: '100%', label: 'Shaffoflik' },
]

const Partners = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.partners_title'),
    description: t('seo.partners_desc'),
  })

  const localizedPartners = partners.map((item, idx) => ({
    ...item,
    name: t(`partners_page.items.p${idx}.name`, item.name),
    desc: t(`partners_page.items.p${idx}.desc`, item.desc),
    tag: t(`partners_page.items.p${idx}.tag`, item.tag),
  }))

  const localizedStats = stats.map((s, i) => ({
    ...s,
    label: t(`partners_page.stats.s${i + 1}_label`, s.label),
  }))

  const pills = [
    t('partners_page.banner.p1', 'Ochiqlik'),
    t('partners_page.banner.p2', 'Shaffoflik'),
    t('partners_page.banner.p3', 'Ishonchlilik'),
    t('partners_page.banner.p4', 'Xalqaro standart'),
  ]

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* HERO */}
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl space-y-5">
            <HeroChip>{t('partners_page.eyebrow', 'Hamkorlik')}</HeroChip>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('partners_page.title_prefix', 'Bizning ')}
              <span className="text-primary">
                {t('partners_page.title_highlight', 'hamkorlarimiz')}
              </span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t(
                'partners_page.desc',
                'UzIntellekt platformasi davlat tashkilotlari, ilmiy muassasalar va xalqaro ekspertlar bilan hamkorlikda faoliyat yuritadi — intellektual mulkni ishonchli va shaffof boshqarish uchun.'
              )}
            </p>
          </div>

          <Card className="w-full lg:w-auto">
            <CardContent className="grid grid-cols-2 divide-x divide-y divide-border p-0 lg:grid-cols-4 lg:divide-y-0">
              {localizedStats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 px-6 py-5">
                  <span className="text-2xl font-bold text-primary">{s.value}</span>
                  <span className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="my-12 h-px w-full bg-border" />

        <Eyebrow className="mb-6">{t('partners_page.stats.s1_label', 'Asosiy hamkorlar')}</Eyebrow>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {localizedPartners.map((item) => (
            <Card key={item.name} className="h-full transition-all hover:-translate-y-1 hover:shadow-soft-md">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <span className="inline-flex w-fit rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-soft-foreground">
                  {item.tag}
                </span>
                <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  Logo
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 border-t border-border pt-3 text-sm font-semibold text-primary">
                  {t('news_block.more', 'Batafsil').replace(' →', '')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Banner */}
        <Card className="mt-16 overflow-hidden border-0 bg-primary text-primary-foreground shadow-soft-md">
          <CardContent className="p-10 text-center sm:p-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/60">
              {t('partners_page.banner.principles', 'Hamkorlik tamoyillari')}
            </p>
            <h3 className="mx-auto mt-4 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
              {t(
                'partners_page.banner.title',
                'Ishonchli hamkorlik — barqaror rivojlanish asosi'
              )}
            </h3>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-primary-foreground/85">
              {t(
                'partners_page.banner.desc',
                "UzIntellekt hamkorlikni ochiqlik, shaffoflik va huquqiy ishonchlilik tamoyillari asosida rivojlantiradi. Har bir hamkorlik kelishuvi xalqaro standartlarga to'liq mos keladi."
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {pills.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Join */}
        <Card className="mt-8">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {t('partners_page.join.title', "Hamkor bo'lishni xohlaysizmi?")}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'partners_page.join.desc',
                  "Biz bilan bog'laning — hamkorlik shartlarini birgalikda muhokama qilamiz."
                )}
              </p>
            </div>
            <Link to="/contact">
              <Button size="lg">
                {t('partners_page.join.btn', "Bog'lanish")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default Partners
