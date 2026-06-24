import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const features = [
  {
    title: 'Huquqiy isbot',
    desc: 'Asaringizni aniq sana va muallif bilan rasmiy ro‘yxatdan o‘tkazish orqali huquqiy isbotga ega bo‘lasiz.',
    icon: '🛡️',
  },
  {
    title: 'Raqamli guvohnoma',
    desc: 'Deponentlash yakunida QR-kodli va verifikatsiya qilinadigan raqamli guvohnoma beriladi.',
    icon: '📜',
  },
  {
    title: 'Xavfsiz saqlash',
    desc: 'Asarlaringiz shifrlangan holda xavfsiz serverlarda saqlanadi.',
    icon: '🔐',
  },
]

const acceptedWorks = [
  '📄 Matnli asarlar (kitob, maqola, dissertatsiya)',
  '🎵 Musiqa va audio asarlar',
  '🎨 Dizayn, rasm, ilustratsiyalar',
  '💻 Dasturiy kod va IT mahsulotlar',
  '🎥 Video va media mahsulotlar',
]

const steps = [
  {
    step: '01',
    title: 'Asarni yuklash',
    desc: 'Asaringizni platformaga yuklaysiz va asosiy ma’lumotlarni to‘ldirasiz.',
  },
  {
    step: '02',
    title: 'Tekshiruv',
    desc: 'Mutaxassislar tomonidan ma’lumotlar tekshiriladi.',
  },
  {
    step: '03',
    title: 'Guvohnoma berish',
    desc: 'Rasmiy raqamli deponentlash guvohnomasini olasiz.',
  },
]

const Depositing = () => {
  const { t } = useTranslation()
  return (
    <section className="pt-28 pb-32 bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* HERO */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-title pb-6">
              {t('depositing_page.title', 'Deponentlash xizmati')}
            </h1>

            <p className="text-lg text-gray-700 leading-relaxed max-w-xl">
              {t('depositing_page.desc', 'Intellektual mulk obyektlarini rasmiy ravishda ro‘yxatdan o‘tkazing, huquqlaringizni mustahkamlang va kelajakdagi nizolardan himoyalaning.')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <NavLink
                to="/login"
                className="
                  px-8 py-4 rounded-xl
                  bg-purple-600 text-white
                  font-semibold text-center
                  hover:bg-purple-700 transition
                  shadow-lg
                "
              >
                {t('depositing_page.start_btn', 'Deponentlashni boshlash')}
              </NavLink>

              <NavLink
                to="/contact"
                className="
                  px-8 py-4 rounded-xl
                  border border-purple-300
                  text-purple-700 font-semibold
                  hover:bg-purple-50 transition
                  text-center
                "
              >
                {t('depositing_page.ask_btn', 'Savol berish')}
              </NavLink>
            </div>
          </div>

          {/* VISUAL CARD */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-10">
            <ul className="space-y-4 text-gray-700 font-medium">
              <li>✔ {t('depositing_page.bullet_1', 'Rasmiy sana va mualliflik tasdiqi')}</li>
              <li>✔ {t('depositing_page.bullet_2', 'Raqamli guvohnoma')}</li>
              <li>✔ {t('depositing_page.bullet_3', 'Xavfsiz saqlash')}</li>
              <li>✔ {t('depositing_page.bullet_4', 'Huquqiy kuchga ega hujjat')}</li>
            </ul>
          </div>
        </div>

        {/* WHY DEPOSIT */}
        <div className="mb-28">
          <h2 className="text-3xl md:text-4xl font-bold gradient-title pb-14">
            {t('depositing_page.why_title', 'Nima uchun deponentlash muhim?')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow hover:shadow-xl transition"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`depositing_page.features.f${idx + 1}_title`, item.title)}
                </h3>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  {t(`depositing_page.features.f${idx + 1}_desc`, item.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mb-28">
          <h2 className="text-3xl md:text-4xl font-bold gradient-title mb-14">
            {t('depositing_page.how_title', 'Qanday ishlaydi?')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-8 shadow"
              >
                <div className="absolute -top-5 left-6 text-5xl font-bold text-purple-200">
                  {item.step}
                </div>
                <h3 className="mt-8 text-lg font-semibold text-gray-900">
                  {t(`depositing_page.steps.s${idx + 1}_title`, item.title)}
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {t(`depositing_page.steps.s${idx + 1}_desc`, item.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ACCEPTED WORKS */}
        <div className="mb-28">
          <h2 className="text-3xl md:text-4xl font-bold gradient-title mb-12">
            {t('depositing_page.works_title', 'Qanday asarlar qabul qilinadi?')}
          </h2>

          <div className="bg-white rounded-3xl shadow-lg p-10">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
              {acceptedWorks.map((item, idx) => (
                <li key={idx} className="text-base">
                  {t(`depositing_page.accepted.${idx}`, item)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold gradient-title pb-6">
            {t('depositing_page.cta_title', 'Asaringizni bugunoq himoyalang')}
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-10">
            {t('depositing_page.cta_desc', 'Deponentlash — bu faqat hujjat emas, bu sizning intellektual mulkingizga bo‘lgan huquqingizni himoya qilishdir.')}
          </p>

          <NavLink
            to="/auth"
            className="
              inline-flex items-center gap-2
              px-10 py-4 rounded-2xl
              bg-purple-600 text-white
              font-semibold text-lg
              hover:bg-purple-700 transition
              shadow-xl
            "
          >
            {t('depositing_page.cta_btn', 'Deponentlashni boshlash →')}
          </NavLink>
        </div>
      </div>
    </section>
  )
}

export default Depositing
