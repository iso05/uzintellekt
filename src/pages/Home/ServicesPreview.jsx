import { NavLink } from 'react-router-dom'

import serviceDeposit from '../../assets/images/service-deposit.webp'
import serviceCertificate from '../../assets/images/service-certificate.webp'
import serviceRights from '../../assets/images/service-rights.webp'
import serviceRegistry from '../../assets/images/service-registry.webp'

const services = [
  {
    title: 'Deponentlash',
    desc: "Intellektual mulk obyektlarini ishonchli ro‘yxatdan o‘tkazish.",
    image: serviceDeposit,
  },
  {
    title: 'Raqamli guvohnoma',
    desc: 'Asaringiz uchun rasmiy raqamli tasdiq.',
    image: serviceCertificate,
  },
  {
    title: 'Huquqlarni boshqarish',
    desc: 'Mualliflik huquqlarini nazorat qilish.',
    image: serviceRights,
  },
  {
    title: 'Ochiq reestrlar',
    desc: "Ro‘yxatdan o‘tgan asarlar bazasi.",
    image: serviceRegistry,
  },
]

const ServicesPreview = () => {
  return (
    <section id="services" className="py-16 sm:py-28 relative services-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* TITLE */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-title mb-8 sm:mb-14">
          Xizmatlarimiz
        </h2>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {services.map((item, idx) => (
            <NavLink
              key={idx}
              to="/services"
              className="
                group
    soft-card
    p-0
    overflow-hidden
    cursor-pointer
    flex
    flex-col
              "
            >
              {/* IMAGE */}
              <div
                className=" relative
      w-full
      h-48
      flex
      items-center
      justify-center
      bg-gradient-to-br
      from-purple-50
      to-indigo-50"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="
                    w-full
        h-full
        object-contain
        scale-110
        transition-transform
        duration-300
        group-hover:scale-125
                  "
                />
              </div>

              {/* TEXT */}
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* HOVER GLOW */}
              <div
                className="
                  absolute inset-0
                  opacity-0
                  group-hover:opacity-100
                  transition
                  bg-gradient-to-t
                  from-purple-50/60
                  to-transparent
                  pointer-events-none
                "
              />
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesPreview
