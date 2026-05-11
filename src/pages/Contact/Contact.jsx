import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'

// form state keys match input name attributes exactly
const INITIAL = { from_name: '', from_email: '', message: '' }

const Contact = () => {
  const formRef = useRef()
  const [form, setForm] = useState(INITIAL)
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  // name attr va state key bir xil — ishlaydi
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (status) setStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBLIC_KEY
      )
      setStatus('success')
      setForm(INITIAL)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="relative pt-16 sm:pt-28 pb-20 sm:pb-32 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-500" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-400/30 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6">
        {/* TITLE */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-2x pt-8  text-5xl font-bold text-white mb-4">
            Biz bilan bog'laning
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base sm:text-lg">
            Savollaringiz bormi yoki hamkorlik qilmoqchimisiz? Biz sizni
            eshitishga tayyormiz.
          </p>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* LEFT — INFO + MAP */}
          <div className="space-y-6 text-white flex flex-col">
            <a
              href="https://maps.google.com/?q=Toshkent,O'zbekiston"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center text-xl transition-all shrink-0">
                📍
              </div>
              <div>
                <h4 className="font-semibold text-lg group-hover:text-purple-200 transition-colors">
                  Manzil
                </h4>
                <p className="text-white/80">Toshkent shahri, O'zbekiston</p>
              </div>
            </a>

            <a
              href="tel:+998000000000"
              className="flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center text-xl transition-all shrink-0">
                📞
              </div>
              <div>
                <h4 className="font-semibold text-lg group-hover:text-purple-200 transition-colors">
                  Telefon
                </h4>
                <p className="text-white/80">+998 (88) 147-00-81</p>
              </div>
            </a>

            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=patentlextashkent@gmail.com"
  target="_blank"
    rel="noopener noreferrer"

              className="flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center text-xl transition-all shrink-0">
                ✉️
              </div>
              <div>
                <h4 className="font-semibold text-lg group-hover:text-purple-200 transition-colors">
                  Email
                </h4>
                <p className="text-white/80">patentlextashkent@gmail.com</p>
              </div>
            </a>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🕐
              </div>
              <div>
                <h4 className="font-semibold text-lg">Ish vaqti</h4>
                <p className="text-white/80">Dushanba – Juma, 9:00 – 18:00</p>
              </div>
            </div>

            <div className="flex-1 min-h-55 rounded-2xl overflow-hidden border border-white/20 shadow-xl mt-2">
              <iframe
                title="UzIntellekt manzil"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d191857.51866833637!2d69.1393703!3d41.2994958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b0cc379e9c3%3A0xa5a9323b4aa5cb98!2sTashkent%2C%20Uzbekistan!5e0!3m2!1sen!2sus!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '220px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Xabar yuborish
            </h2>

            {status === 'success' && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-400/40 text-green-100 text-sm">
                ✅ Xabaringiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.
              </div>
            )}

            {status === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-sm">
                ⚠️ Xatolik yuz berdi. Iltimos qayta urinib ko'ring.
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/90">
                  Ismingiz
                </label>
                <input
                  type="text"
                  name="from_name"
                  value={form.from_name}
                  onChange={handleChange}
                  placeholder="Ismingizni kiriting"
                  required
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-300 focus:bg-white/15 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/90">
                  Email
                </label>
                <input
                  type="email"
                  name="from_email"
                  value={form.from_email}
                  onChange={handleChange}
                  placeholder="example@mail.com"
                  required
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-300 focus:bg-white/15 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/90">
                  Xabar
                </label>
                <textarea
                  name="message"
                  rows="5"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Xabaringizni yozing..."
                  required
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-300 focus:bg-white/15 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 rounded-xl bg-white text-purple-700 font-semibold text-base hover:bg-purple-50 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  'Yuborish →'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
