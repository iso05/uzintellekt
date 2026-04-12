import { NavLink } from 'react-router-dom'

// SERVICE PACKAGES
const services = [
  {
    id: 1,
    name: 'Deponentlash',
    icon: '🏛️',
    desc: "Intellektual mulkingizni rasmiy ravishda ro'yxatdan o'tkazing",
    features: [
      'Rasmiy sana tasdiqi',
      'Raqamli guvohnoma',
      'Huquqiy kuchga ega',
      'Xavfsiz saqlash',
    ],
    highlight: true,
  },
  {
    id: 2,
    name: 'Qaydnoma hizmati',
    icon: '📋',
    desc: 'Asarlaringizni platformada baholang va reyting olasiz',
    features: [
      'Asarni qayd etish',
      'Reyting tizimi',
      'Detaliy xulosa',
      'Sertifikat',
    ],
  },
  {
    id: 3,
    name: 'Huquqiy maslahati',
    icon: '⚖️',
    desc: "Intellektual mulk huquqlari bo'yicha mutaxassislar bilan muloqot",
    features: [
      'Onlayn maslaha',
      'Hujjatlar tahlili',
      'Huquq himoyasi',
      'Nizolarni hal etish',
    ],
  },
  {
    id: 4,
    name: 'Litsenziyalash',
    icon: '📜',
    desc: 'Asarlaringiz uchun litsenziyaviy shartlar yarating va daromad oling',
    features: [
      'Litsenziya shartlari',
      "To'lov tizimi",
      'Monitoring',
      'Hisobot',
    ],
  },
]

// WHAT WE CAN PROVIDE
const providedWorks = [
  {
    category: '📚 Matnli asarlar',
    items: [
      'Kitoblar',
      'Dissertatsiyalar',
      'Maqolalar',
      'Loyihalar',
      'Taqdimotlar',
    ],
  },
  {
    category: '🎵 Audio va musiqa',
    items: [
      'Kuylar',
      'Vokal traklari',
      'Arranjirovkalar',
      'Podcast',
      'Remikslari',
    ],
  },
  {
    category: '🎨 Vizual ijodiyot',
    items: [
      'Rasmlar',
      'Ilustratsiyalar',
      'Dizayn loyal',
      'Fotografiyalar',
      'Logolar',
    ],
  },
  {
    category: '💻 Texnik asarlar',
    items: [
      'Dasturiy kod',
      'Veb-saytlar',
      'Mobilka',
      "API'lar",
      'Elektron kurstalar',
    ],
  },
  {
    category: '🎬 Mediya kontenti',
    items: [
      'Videolar',
      'Animasiyalar',
      'Dokumentlar',
      'Kompilatsiyalar',
      'Trailerlar',
    ],
  },
  {
    category: '🏆 Boshqa solalar',
    items: [
      'Ixtirolar',
      'Rasm naqshlari',
      'Arxitektura',
      'Joriy va tarixiy',
      'Tarkibiy noyalar',
    ],
  },
]

// PROCESS STEPS
const processSteps = [
  {
    number: '01',
    title: "Ro'yxatdan o'tish",
    desc: "Platformada profil yarating va asosiy ma'lumotlarni kiriting",
    icon: '👤',
  },
  {
    number: '02',
    title: 'Asarni yuklash',
    desc: 'Asarning fayl yoki tasvirini platformaga yuklaysiz',
    icon: '⬆️',
  },
  {
    number: '03',
    title: "Ma'lumotlarni to'ldirish",
    desc: "Asar haqida batafsil ma'lumotlar kiriting: nom, muallif, tavsifi",
    icon: '📝',
  },
  {
    number: '04',
    title: 'Tekshiruv',
    desc: "Mutaxassislar tomonidan ma'lumotlar tasdiqlanadi (1-3 kun)",
    icon: '✓',
  },
  {
    number: '05',
    title: "To'lov",
    desc: "Deponentlash haqini to'lasiz (shaffof va qulay usullar)",
    icon: '💳',
  },
  {
    number: '06',
    title: 'Guvohnoma olish',
    desc: 'Rasmiy raqamli guvohnomani email orqali olasiz',
    icon: '🎖️',
  },
]

// BENEFITS
const benefits = [
  {
    title: 'Huquqiy himoya',
    desc: "Asarlaringiz qonuniy hovuzda to'la himoya qilinadi",
    icon: '🛡️',
  },
  {
    title: 'Raqamli guvohnoma',
    desc: 'QR-kod va verifikatsiya bilan yuqori darajadagi hujjat',
    icon: '🏅',
  },
  {
    title: 'Xavfsiz saqlash',
    desc: 'Shifrlangan serverlar va 24/7 ziyonet monitoring',
    icon: '🔐',
  },
  {
    title: "Biznesingizni o'stering",
    desc: "Asarlarni litsenziyalang va qo'shimcha daromad oling",
    icon: '📈',
  },
  {
    title: 'Professional tahlil',
    desc: 'Mutaxassislar tomonidan batafsil baholash va tavsiyalar',
    icon: '🔍',
  },
  {
    title: "Davlatning tan'olishi",
    desc: "Qonuniy sharoitda to'la e'tirof etilgan raqamli guvohnoma",
    icon: '✅',
  },
]

const Services = () => {
  return (
    <main className="bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-linear-to-br from-purple-600 via-indigo-600 to-blue-600 pt-32 pb-24">
        {/* ANIMATED BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 opacity-5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Intellektual mulkingizni himoya qiling
              </h1>
              <p className="text-lg text-white/90 mb-10 leading-relaxed max-w-xl">
                Biz siz uchun eng sodda, eng tez va eng xavfsiz deponentlash
                xizmati taqdim etamiz. Asarlarni to'xyahshi himoya qiling va
                kelajakda qiqqanlarga qarshi turishing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <NavLink
                  to="/register"
                  className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition shadow-xl text-center"
                >
                  Boshlash →
                </NavLink>
                <NavLink
                  to="/contact"
                  className="px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition border border-white/30 text-center"
                >
                  Batafsil ma'lumot
                </NavLink>
              </div>

              {/* STATS */}
              <div className="mt-16 grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold">10K+</p>
                  <p className="text-white/80 text-sm">Foydalanuvchilar</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-white/80 text-sm">
                    Deposittlangan asarlar
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-white/80 text-sm">Xizmat ko'rsatish</p>
                </div>
              </div>
            </div>

            {/* RIGHT - VISUAL CARD */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-linear-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="font-semibold">Asarni yuklash</p>
                  </div>
                  <div className="bg-linear-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="text-4xl mb-2">✓</div>
                    <p className="font-semibold">Tekshiruv</p>
                  </div>
                  <div className="bg-linear-to-br from-indigo-400 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="text-4xl mb-2">🎖️</div>
                    <p className="font-semibold">Guvohnoma</p>
                  </div>
                  <div className="bg-linear-to-br from-pink-400 to-pink-600 rounded-2xl p-6 text-white">
                    <div className="text-4xl mb-2">🔐</div>
                    <p className="font-semibold">Himoya</p>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                  <p className="text-white/90 text-sm">
                    <strong>⚡ Tez:</strong> 1-3 kun ichida guvohnoma oling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 pb-2">
              Bizning xizmatlarimiz
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Intellektual mulkni himoya qilish va o'stirish uchun to'liq yechim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className={`rounded-2xl p-8 transition transform hover:scale-105 ${
                  service.highlight
                    ? 'bg-linear-to-br from-purple-600 to-indigo-600 text-white shadow-2xl ring-2 ring-purple-300'
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3">{service.name}</h3>
                <p
                  className={`text-sm mb-6 ${service.highlight ? 'text-white/90' : 'text-gray-600'}`}
                >
                  {service.desc}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`text-sm flex items-center gap-2 ${service.highlight ? 'text-white/80' : 'text-gray-700'}`}
                    >
                      <span className="text-lg">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE ACCEPT */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 pb-2">
              Qanday asarlarni qabul qilamiz?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Har qanday soha, har qanday tipdagi intellektual mulk
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providedWorks.map((work, idx) => (
              <div
                key={idx}
                className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {work.category}
                </h3>
                <ul className="space-y-3">
                  {work.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <span className="w-2 h-2 bg-linear-to-r from-purple-600 to-indigo-600 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="py-24 px-6 bg-linear-to-b from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent  pb-2">
              6 qadamda deponentlang
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Sodda, tez va tushunarli jarayon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="group relative">
                {/* CONNECTION LINE */}
                {idx < processSteps.length - 1 && idx % 3 !== 2 && (
                  <div className="hidden lg:block absolute -right-4 top-16 w-8 h-1 bg-linear-to-r from-purple-400 to-transparent"></div>
                )}

                {/* CARD */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition relative">
                  {/* STEP NUMBER */}
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-linear-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>

                  {/* ICON */}
                  <div className="text-5xl mb-6 mt-4">{step.icon}</div>

                  {/* CONTENT */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TIMELINE BOTTOM */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-lg font-semibold">
              ⏱️ Umumiy vaqt: <span className="text-purple-600">3-5 kun</span>
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent pb-4">
              Nima uchun bizni tanlaysiz?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              6 ta asosiy manfa'at va imkoniyatlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition relative overflow-hidden group"
              >
                {/* linear BACKGROUND ON HOVER */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition -z-10"></div>

                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* BACKGROUND DECORATION */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent pb-6">
            Asaringizni bugunoq himoya qiling
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
            Minglab mutaxassislar va ijodi o'zlari asarlarini bizga
            ishonmoqdalar. Siz ham qila olasiz.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NavLink
              to="/register"
              className="px-10 py-5 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transition text-lg"
            >
              Boshlang →
            </NavLink>
            <NavLink
              to="/contact"
              className="px-10 py-5 bg-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-300 transition text-lg"
            >
              Savollar berish
            </NavLink>
          </div>

          <p className="mt-8 text-gray-600 text-sm">
            💳 Kredit kartasiz ro'yxatdan o'tish. 🔐 Barcha ma'lumotlar
            shifrlangan.
          </p>
        </div>
      </section>

      {/* FAQ PREVIEW */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Tez-tez so'raladigan savollar
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Deponentlash qanchalik uzoq vaqt oladi?',
                a: "Odatda 1-3 kun. Hujjatlarni kiritgach, mutaxassislar tekshiruv o'tkazadi va siz guvohnomasini olasiz.",
              },
              {
                q: "Mening asarlarini boshqalar ko'rishi mumkinmi?",
                a: "Yo'q. Barcha ma'lumotlar shifrlangan va faqat siz ishongan shaxslar ko'rishishi mumkin.",
              },
              {
                q: 'Deponentlash guvohnomasining huquqiy kuchi qancha?',
                a: "O'zbekistonda to'la qonuniy kuchga ega. Sudda dalil sifatida ishlatilishi mumkin.",
              },
              {
                q: 'Nechta asarni deponentlash mumkin?',
                a: "Cheksiz. Siz xohlagancha ko'p asarni himoya qila olasiz.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition"
              >
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-purple-600 text-xl">❓</span> {item.q}
                </h3>
                <p className="text-gray-600 ml-6">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <NavLink
              to="/contact"
              className="text-purple-600 font-bold text-lg hover:text-indigo-600 transition"
            >
              Ko'proq savol-javoblar →
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Services
