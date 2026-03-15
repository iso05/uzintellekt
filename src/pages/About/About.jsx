const About = () => {
  return (
    <section className="relative pt-28 pb-36 overflow-hidden bg-linear-to-br from-purple-50 via-white to-purple-100">
      
      {/* DECORATIVE BLURS */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] bg-indigo-300/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">

        {/* HERO HEADER */}
        <div className="max-w-3xl mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-title leading-tight mb-6">
            Biz haqimizda
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed">
            <strong>UzIntellekt</strong> — intellektual mulk obyektlarini
            ro‘yxatdan o‘tkazish, huquqiy himoya qilish va raqamli boshqarish
            uchun yaratilgan zamonaviy milliy platforma.
          </p>
        </div>

        {/* MISSION + VISION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">

          {/* MISSION */}
          <div className="relative bg-white/80 backdrop-blur rounded-3xl p-10 shadow-lg">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
              Bizning missiyamiz
            </span>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Intellektual mulkni ishonchli himoyalash
            </h3>

            <p className="text-gray-700 leading-relaxed">
              Mualliflar, tadqiqotchilar va tashkilotlar o‘z asarlarini
              huquqiy jihatdan himoyalangan, shaffof va raqamli muhitda
              boshqarish imkoniga ega bo‘lishi uchun platforma yaratish.
            </p>
          </div>

          {/* VISION */}
          <div className="relative bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl">
            <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold bg-white/20">
              Bizning maqsadimiz
            </span>

            <h3 className="text-2xl font-bold mb-4">
              Markaziy Osiyodagi yetakchi platforma
            </h3>

            <p className="leading-relaxed text-white/90">
              UzIntellekt platformasini xalqaro standartlarga mos,
              ishonchli va raqamli huquq infratuzilmasining ajralmas qismi
              sifatida rivojlantirish.
            </p>
          </div>
        </div>

        {/* VALUES */}
        <div className="mb-28">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Bizning qadriyatlarimiz
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <Value
              title="Shaffoflik"
              text="Barcha jarayonlar ochiq, tushunarli va huquqiy asoslangan."
            />

            <Value
              title="Xavfsizlik"
              text="Ma’lumotlar zamonaviy kriptografik va texnik himoya bilan ta’minlanadi."
            />

            <Value
              title="Innovatsiya"
              text="Raqamli texnologiyalar orqali huquqni soddalashtirish."
            />
          </div>
        </div>

        {/* FINAL STATEMENT */}
        <div className="relative bg-white rounded-3xl p-12 shadow-xl max-w-5xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Intellektual mulkingiz — bizning mas’uliyatimiz
          </h3>

          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
            UzIntellekt jamoasi mualliflik huquqlarini himoyalash,
            raqamli sertifikatlash va huquqiy boshqaruvni
            zamonaviy texnologiyalar bilan uyg‘unlashtiradi.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;


/* SUB COMPONENT */
const Value = ({ title, text }) => (
  <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition">
    <h4 className="text-xl font-semibold text-purple-700 mb-3">
      {title}
    </h4>
    <p className="text-gray-600 leading-relaxed">
      {text}
    </p>
  </div>
);
