import { useTranslation } from 'react-i18next'

const Leadership = () => {
  const { t } = useTranslation()

  return (
    <section className="pt-28 pb-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-bold gradient-title pb-6">
          {t('leadership_page.title', 'Rahbariyat')}
        </h1>

        <p className="text-gray-600 max-w-3xl mb-12">
          {t('leadership_page.desc', 'Jamiyat rahbariyati, bosh direktor va asosiy mas’ul shaxslar haqida rasmiy ma’lumotlar.')}
        </p>

        {/* KEYIN: direktorlar cardlari */}
        <div className="text-gray-400 italic">
          {t('leadership_page.notice', 'Tez orada rahbariyat tarkibi joylanadi.')}
        </div>
      </div>
    </section>
  )
}

export default Leadership
