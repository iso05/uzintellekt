const partners = [
  { name: 'Haier' },
  { name: 'EA Games' },
  { name: 'EA Games' },
  { name: 'Haier' },
  { name: 'EA Games' },
  { name: 'EA Games' },
]

const Partners = () => {
  return (
    <section
      id="partners"
      className="relative partners-bg py-16 sm:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-title mb-8 sm:mb-14 text-center">
          Hamkorlarimiz
        </h2>

        <div className="relative overflow-hidden">
          <div className="partners-track">
            {[...partners, ...partners].map((item, idx) => (
              <div key={idx} className="partner-card">
                <span className="partner-name font-semibold text-gray-700">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partners
