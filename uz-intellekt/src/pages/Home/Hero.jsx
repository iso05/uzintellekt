import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react'
import { Button, HeroChip } from '@/shared/ui'
import heroImg from '@/assets/illustrations/hero-f-c.svg'

const Hero = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary-soft via-background to-background" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <HeroChip icon={ShieldCheck}>{t('hero.badge', 'Intellektual mulk himoyasi')}</HeroChip>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('hero.title_prefix', 'Intellektual Mulkingizni ')}
            <span className="text-primary">
              {t('hero.title_highlight', 'Himoya Qiling')}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t(
              'hero.desc',
              "Mualliflik huquqlarini ro'yxatdan o'tkazing, boshqaring va raqamli platforma orqali ishonchli himoyalang."
            )}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate('/login')}>
              {t('hero.cta', "A'zo bo'lish / Kirish")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/services')}>
              {t('hero.cta_secondary', 'Xizmatlar bilan tanishing')}
            </Button>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" />
            {t('hero.trust', "OneID orqali xavfsiz va tez kirish")}
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <img
            src={heroImg}
            alt={t('hero.image_alt', 'UzIntellekt')}
            loading="eager"
            decoding="async"
            className="w-full max-w-md"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
