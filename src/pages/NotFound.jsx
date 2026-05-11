import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import useScrollToTop from '../hooks/useScrollToTop'

const NotFound = () => {
  // Scroll to top when page loads
  useScrollToTop()

  const navigate = useNavigate()

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 px-4 py-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-float-delayed" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl text-center px-3 sm:px-4">
        {/* 404 Number */}
        <div className="mb-6 sm:mb-8 relative">
          <h1 className="text-6xl sm:text-8xl md:text-9xl xl:text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-2xl leading-none">
            404
          </h1>
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded-full blur-3xl -z-10" />
        </div>

        {/* Main Message */}
        <div className="mb-6 sm:mb-8 space-y-2 sm:space-y-4">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
            Sahifa topilmadi
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-light">
            Afsuski, siz qidirgan sahifa mavjud emas yoki o'chirilgan bo'lishi
            mumkin.
          </p>
        </div>

        {/* Decorative Icons */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-8 sm:mb-12 text-gray-400">
          <div className="animate-bounce" style={{ animationDelay: '0s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 flex items-center justify-center">
              ❓
            </div>
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center">
              🔍
            </div>
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center">
              🗺️
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="group px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-lg text-sm sm:text-base"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Orqaga qaytish
          </button>

          <button
            onClick={() => navigate('/')}
            className="group px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Asosiy sahifaga
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 sm:mt-16 pt-4 sm:pt-8 border-t border-white/10">
          <p className="text-gray-400 text-sm mb-4">
            Agar muammoni davom etayotgan bo'lsa, iltimos biz bilan bog'laning:
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Aloqa sahifasini tashrif buyuring →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(-20px); }
          50% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite; }
      `}</style>
    </section>
  )
}

export default NotFound
