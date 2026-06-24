import { useTranslation } from 'react-i18next'

const Structure = () => {
  const { t } = useTranslation()

  return (
    <section className="pt-28 pb-32 bg-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-bold gradient-title pb-6">
          {t('structure_page.title', 'Tuzilma')}
        </h1>

        <p className="text-gray-600 max-w-3xl mb-12">
          {t('structure_page.desc', 'Jamiyatning tashkiliy tuzilmasi va bo‘limlar o‘rtasidagi bog‘liqlik.')}
        </p>

        {/* KEYIN: schema / diagram */}
        <div className="text-gray-400 italic">
          {t('structure_page.notice', 'Tuzilma sxemasi tez orada qo‘shiladi.')}
        </div>
      </div>
    </section>
  )
}

export default Structure
