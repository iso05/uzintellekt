import { useTranslation } from 'react-i18next'
import { useSEO } from '@/hooks/useSEO'
import Hero from './Hero'
import HowItWorks from './HowItWorks'
import NewsPreview from './NewsPreview'
import Partners from './Partners'
import ServicesPreview from './ServicesPreview'

const Home = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.home_title'),
    description: t('seo.home_desc'),
  })

  return (
    <>
      <Hero />
      <ServicesPreview />
      <HowItWorks />
      <NewsPreview />
      <Partners />
    </>
  )
}

export default Home
