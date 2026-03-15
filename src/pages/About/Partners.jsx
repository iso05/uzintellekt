const partners = [
  {
    name: "Intellektual mulk agentligi",
    desc: "Intellektual mulkni huquqiy himoyalash bo‘yicha davlat tashkiloti.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png",
  },
  {
    name: "Oliy ta’lim vazirligi",
    desc: "Ilmiy va ta’lim muassasalari bilan hamkorlik.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png",
  },
  {
    name: "Raqamli texnologiyalar markazi",
    desc: "Platformaning texnik infratuzilmasini rivojlantirish.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    name: "Xalqaro ekspertlar guruhi",
    desc: "Xalqaro standartlar va konsultatsiyalar.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
];

const Partners = () => {
  return (
    <section className="relative pt-28 pb-36 overflow-hidden bg-linear-to-br from-purple-50 via-white to-purple-100">

      {/* DECORATIVE BLUR */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-40 w-[420px] h-[420px] bg-indigo-300/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="max-w-3xl mb-20">
          <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-6">
            Hamkorlarimiz
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            UzIntellekt platformasi davlat tashkilotlari, ilmiy muassasalar
            va xalqaro ekspertlar bilan hamkorlikda faoliyat yuritadi.
          </p>
        </div>

        {/* PARTNERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-28">
          {partners.map((item, idx) => (
            <div
              key={idx}
              className="
                group
                bg-white
                rounded-3xl
                p-8
                shadow-md
                hover:shadow-2xl
                transition
                relative
                overflow-hidden
              "
            >
              {/* HOVER ACCENT */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition" />

              {/* LOGO */}
              <div className="relative h-20 flex items-center mb-6">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="max-h-12 max-w-[160px] object-contain"
                />
              </div>

              {/* TEXT */}
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TRUST STATEMENT */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-12 text-white text-center shadow-xl max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Ishonchli hamkorlik — barqaror rivojlanish asosi
          </h3>
          <p className="text-white/90 leading-relaxed max-w-3xl mx-auto">
            UzIntellekt hamkorlikni ochiqlik, shaffoflik va huquqiy
            ishonchlilik tamoyillari asosida rivojlantiradi.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Partners;
