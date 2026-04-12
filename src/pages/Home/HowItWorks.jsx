const steps = [
  {
    title: 'O‘zingiz ishongan ishni yuklang',
    desc: 'Intellektual mulkingizni tizimga yuklaysiz.',
    icon: '⬆️',
  },
  {
    title: 'Ma’lumotlar tasdiqlanadi',
    desc: 'Yuklangan ma’lumotlar tekshiriladi.',
    icon: '✔️',
  },
  {
    title: 'Guvohnomani oling',
    desc: 'Rasmiy raqamli guvohnoma olasiz.',
    icon: '📄',
  },
]

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative how-bg py-28 overflow-hidden"
    >
      {/* BACK ILLUSTRATION */}
      <div className="how-illustration" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6">
        {/* TITLE */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-title mb-8 sm:mb-16 pb-3">
          Qanday ishlaydi
        </h2>

        {/* STEPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-13 relative">
          {steps.map((item, idx) => (
            <div key={idx} className="how-card relative">
              {/* STEP NUMBER */}
              <div className="step-badge">{idx + 1}</div>

              {/* ICON */}
              <div className="how-icon">{item.icon}</div>

              {/* TEXT */}
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {item.desc}
              </p>

              {/* ARROW (except last) */}
              {idx !== steps.length - 1 && <div className="step-arrow" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
