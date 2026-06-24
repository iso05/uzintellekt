import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'

import serviceDeposit from '@/assets/illustrations/service-deposit.svg'
import serviceCertificate from '@/assets/illustrations/service-certificate.svg'
import serviceRights from '@/assets/illustrations/service-rights.svg'
import serviceRegistry from '@/assets/illustrations/service-registry.svg'

const services = [
  {
    titleKey: 'services_preview.items.dep.title',
    titleFallback: 'Deponentlash',
    descKey: 'services_preview.items.dep.desc',
    descFallback: "Intellektual mulk obyektlarini ishonchli ro'yxatdan o'tkazish.",
    image: serviceDeposit,
  },
  {
    titleKey: 'services_preview.items.cert.title',
    titleFallback: 'Raqamli guvohnoma',
    descKey: 'services_preview.items.cert.desc',
    descFallback: 'Asaringiz uchun rasmiy raqamli tasdiq.',
    image: serviceCertificate,
  },
  {
    titleKey: 'services_preview.items.rights.title',
    titleFallback: 'Huquqlarni boshqarish',
    descKey: 'services_preview.items.rights.desc',
    descFallback: 'Mualliflik huquqlarini nazorat qilish.',
    image: serviceRights,
  },
  {
    titleKey: 'services_preview.items.registry.title',
    titleFallback: 'Ochiq reestrlar',
    descKey: 'services_preview.items.registry.desc',
    descFallback: "Ro'yxatdan o'tgan asarlar bazasi.",
    image: serviceRegistry,
  },
]

const ServicesPreview = () => {
  const { t } = useTranslation()
  return (
    <section id="services" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {t('services_preview.eyebrow', 'Xizmatlar')}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('services_preview.title', 'Xizmatlarimiz')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t(
              'services_preview.subtitle',
              'Intellektual mulk uchun to\'liq raqamli ekotizim.'
            )}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <NavLink key={item.titleKey} to="/services" className="group">
              <Card className="h-full overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft-md">
                <div className="flex h-44 items-center justify-center overflow-hidden bg-primary-soft">
                  <img
                    src={item.image}
                    alt={t(item.titleKey, item.titleFallback)}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {t(item.titleKey, item.titleFallback)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(item.descKey, item.descFallback)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100">
                    {t('services_preview.more', 'Batafsil')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesPreview
