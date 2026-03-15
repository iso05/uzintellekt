import '../../index.css'
import heroImg from '../../assets/images/hero-img.png'
import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen overflow-hidden ">
      {/* BACKGROUND */}
      <div className="absolute inset-0 hero-bg" />
      <div className="custom-shape-divider-top-1770149441 ">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          {/* GRADIENT DEFINITION */}
          <defs>
            <linearGradient
              id="purpleWaveGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#712edf" />
              <stop offset="80%" stopColor="#712edf" />
              <stop offset="100%" stopColor="#712edf" />
            </linearGradient>
          </defs>

          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity="0.25"
            fill="url(#purpleWaveGradient)"
          />

          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity="0.45"
            fill="url(#purpleWaveGradient)"
          />

          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="url(#purpleWaveGradient)"
          />
        </svg>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-[calc(100vh-80px)] flex items-center">
        <div
          className="
            flex flex-col
            lg:flex-row
            w-full
            items-center
            gap-12
          "
        >
          {/* TEXT — ALWAYS FIRST */}
          <div className="text-white w-full lg:w-1/2 text-center lg:text-left">
            <h1
              className="
                text-4xl
                sm:text-5xl
                md:text-5xl
                lg:text-5xl
                xl:text-6xl
                font-bold
                leading-tight
              "
            >
              Intellektual Mulkingizni
              <br />
              <span className="text-purple-200">Himoya Qiling</span>
            </h1>

            <p
              className="
                mt-6
                text-base
                sm:text-lg
                md:text-lg
                lg:text-lg
                xl:text-xl
                text-white/80
                max-w-xl
                mx-auto
                lg:mx-0
              "
            >
              Mualliflik huquqlarini ro‘yxatdan o‘tkazing, boshqaring va raqamli
              platforma orqali ishonchli himoyalang.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/register')}
                className="
                  px-10 py-4
                  rounded-2xl
                  bg-white text-purple-700
                  text-lg
                  font-semibold
                  cursor-pointer
                  hover:bg-purple-50 hover:shadow-2xl
                  transition-all duration-300
                  shadow-xl
                  hover:-translate-y-1
                "
              >
                Ro'yxatdan o'tish
              </button>

              <button
                onClick={() => navigate('/login')}
                className="
                  px-10 py-4
                  rounded-2xl
                  bg-white/20 text-white border border-white/40
                  text-lg
                  font-semibold
                  cursor-pointer
                  hover:bg-white/30 hover:border-white/70 hover:shadow-2xl
                  transition-all duration-300
                  shadow-xl
                  hover:-translate-y-1
                  backdrop-blur
                "
              >
                Kirish
              </button>
            </div>
          </div>

          {/* IMAGE — ALWAYS BELOW TEXT UNTIL DESKTOP */}
          <div className="w-full lg:w-3/4 flex justify-center mt-8 lg:mt-0">
            <img
              src={heroImg}
              alt="Hero"
              className="hero-float lg:pr-0 pr-15"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
