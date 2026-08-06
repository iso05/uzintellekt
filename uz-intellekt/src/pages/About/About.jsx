import { useTranslation } from 'react-i18next'
import { Card, CardContent, Eyebrow, HeroChip } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const About = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.about_title'),
    description: t('seo.about_desc'),
  })
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <HeroChip>{t('about_page.eyebrow', 'UzIntellekt')}</HeroChip>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t('about_page.title', 'Biz haqimizda')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t(
              'about_page.desc',
              "UzIntellekt — intellektual mulk obyektlarini ro'yxatdan o'tkazish, huquqiy himoya qilish va raqamli boshqarish uchun yaratilgan zamonaviy milliy platforma."
            )}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-8">
              <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
                {t('about_page.mission', 'Bizning missiyamiz')}
              </span>
              <h3 className="mt-4 text-xl font-bold text-foreground">
                {t('about_page.mission_title', 'Intellektual mulkni ishonchli himoyalash')}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t(
                  'about_page.mission_desc',
                  "Mualliflar, tadqiqotchilar va tashkilotlar o'z asarlarini huquqiy jihatdan himoyalangan, shaffof va raqamli muhitda boshqarish imkoniga ega bo'lishi uchun platforma yaratish."
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-primary text-primary-foreground shadow-soft-md">
            <CardContent className="p-8">
              <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold text-primary-foreground">
                {t('about_page.vision', 'Bizning maqsadimiz')}
              </span>
              <h3 className="mt-4 text-xl font-bold">
                {t('about_page.vision_title', 'Markaziy Osiyodagi yetakchi platforma')}
              </h3>
              <p className="mt-3 leading-relaxed text-primary-foreground/90">
                {t(
                  'about_page.vision_desc',
                  "UzIntellekt platformasini xalqaro standartlarga mos, ishonchli va raqamli huquq infratuzilmasining ajralmas qismi sifatida rivojlantirish."
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <Eyebrow>{t('about_page.values_eyebrow', 'Qadriyatlar')}</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('about_page.values', 'Bizning qadriyatlarimiz')}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Value
              title={t('about_page.val_1_title', 'Shaffoflik')}
              text={t(
                'about_page.val_1_desc',
                'Barcha jarayonlar ochiq, tushunarli va huquqiy asoslangan.'
              )}
            />
            <Value
              title={t('about_page.val_2_title', 'Xavfsizlik')}
              text={t(
                'about_page.val_2_desc',
                "Ma'lumotlar zamonaviy kriptografik va texnik himoya bilan ta'minlanadi."
              )}
            />
            <Value
              title={t('about_page.val_3_title', 'Innovatsiya')}
              text={t(
                'about_page.val_3_desc',
                'Raqamli texnologiyalar orqali huquqni soddalashtirish.'
              )}
            />
          </div>
        </div>

        <Card className="mt-16 bg-muted/40">
          <CardContent className="p-10 text-center">
            <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t(
                'about_page.final_title',
                "Intellektual mulkingiz — bizning mas'uliyatimiz"
              )}
            </h3>
            <p className="mx-auto mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {t(
                'about_page.final_desc',
                "UzIntellekt jamoasi mualliflik huquqlarini himoyalash, raqamli sertifikatlash va huquqiy boshqaruvni zamonaviy texnologiyalar bilan uyg'unlashtiradi."
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

const Value = ({ title, text }) => (
  <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-soft-md">
    <CardContent className="p-6">
      <h4 className="text-base font-semibold text-primary">{title}</h4>
      <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
    </CardContent>
  </Card>
)

export default About
