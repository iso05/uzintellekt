// src/pages/Auth/Register.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SearchableCombobox from '../../components/ui/SearchableCombobox'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, registerWithOneId, handleCallback } = useAuth()

  const [step, setStep]                         = useState(1)
  const [loading, setLoading]                   = useState(false)
  const [regionsLoading, setRegionsLoading]     = useState(true)
  const [termsAccepted, setTermsAccepted]       = useState(false)
  const [registrationSuccess, setSuccess]       = useState(false)
  const [error, setError]                       = useState(null)

  const [form, setForm] = useState({
    phoneRequired: '',
    phoneOptional: '',
    region: '',
    district: '',
    street: '',
    houseNumber: '',
  })

  const [regions, setRegions]                   = useState([])
  const [allDistricts, setAllDistricts]         = useState([])
  const [filteredDistricts, setFiltered]        = useState([])

  // Allaqachon login → dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])

  // Regions & Districts
  useEffect(() => {
    Promise.all([
      fetch('https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json').then(r => r.json()),
      fetch('https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json').then(r => r.json()),
    ]).then(([reg, dis]) => {
      setRegions(reg)
      setAllDistricts(dis)
    }).catch(console.error)
      .finally(() => setRegionsLoading(false))
  }, [])

  useEffect(() => {
    if (form.region) {
      setFiltered(allDistricts.filter(d => d?.region_id === parseInt(form.region)))
      setForm(p => ({ ...p, district: '' }))
    } else {
      setFiltered([])
    }
  }, [form.region, allDistricts])

  // OneID callback: /login?code=...&state=...
  useEffect(() => {
    const code       = searchParams.get('code')
    const state      = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) { setError('OneID xatolik: ' + errorParam); return }
    if (!code) return

    window.history.replaceState({}, '', '/login')
    setLoading(true)
    setStep(2)

    handleCallback(code, state)
      .then(() => {
        setSuccess(true)
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [searchParams])

  const handleChange = (e) => {
    setError(null)
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const isValidPhone = (p) => {
    if (!p) return false
    const c = p.replace(/[^\d+]/g, '')
    return /^(\+998|998)?[0-9]{9}$/.test(c) || c.length === 12
  }

  const step1Complete = () =>
    form.phoneRequired && isValidPhone(form.phoneRequired) &&
    form.region && form.district && form.street && form.houseNumber

  const handleNext = () => {
    if (!step1Complete()) { setError("Barcha * maydonlarni to'ldiring."); return }
    setError(null)
    setStep(2)
  }

  const handleRegister = () => {
    if (!termsAccepted) { setError("Foydalanish shartlariga rozilik bering."); return }
    registerWithOneId(form)
  }

  // ── Input style ─────────────────────────────────────────────
  const inputCls = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
  const labelCls = "block text-white/90 text-sm font-medium mb-2"

  return (
    <section className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-blue-700 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">

          {/* STEPS */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step > n  ? 'bg-green-500 text-white' :
                    step === n ? 'bg-linear-to-br from-purple-400 to-indigo-500 text-white shadow-lg shadow-purple-500/30' :
                    'bg-white/20 text-white/50'
                  }`}>
                    {step > n ? '✓' : n}
                  </div>
                  {n === 1 && (
                    <div className={`h-1 w-8 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-purple-400' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {registrationSuccess ? 'Muvaffaqiyatli! 🎉' : "Ro'yxatdan o'tish"}
            </h1>
            <p className="text-white/60 text-sm">
              {step === 1 ? 'Manzil va aloqa ma\'lumotlari' : 'OneID orqali tasdiqlash'}
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/70 text-sm">OneID tasdiqlash kutilmoqda...</p>
            </div>
          )}

          {/* SUCCESS */}
          {registrationSuccess && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/40 text-green-100 text-sm text-center mb-4">
              ✅ Ro'yxatdan o'tdingiz! Dashboard'ga yo'naltirilmoqda...
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {!loading && !registrationSuccess && step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Telefon raqami *</label>
                <input type="tel" name="phoneRequired" value={form.phoneRequired}
                  onChange={handleChange} placeholder="+998 90 123 45 67" className={inputCls} />
                {form.phoneRequired && !isValidPhone(form.phoneRequired) && (
                  <p className="mt-1 text-red-300 text-xs">Noto'g'ri format (+998XXXXXXXXX)</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Qo'shimcha telefon</label>
                <input type="tel" name="phoneOptional" value={form.phoneOptional}
                  onChange={handleChange} placeholder="+998 91 234 56 78" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Viloyat *</label>
                {regionsLoading
                  ? <div className={`${inputCls} animate-pulse text-white/40`}>Yuklanmoqda...</div>
                  : <SearchableCombobox
                      options={regions.filter(r => r?.id && r?.name).map(r => ({ value: String(r.id), label: r.name }))}
                      value={form.region}
                      onChange={v => setForm(p => ({ ...p, region: v }))}
                      placeholder="Viloyatni tanlang"
                    />
                }
              </div>

              <div>
                <label className={labelCls}>Tuman *</label>
                <SearchableCombobox
                  options={filteredDistricts.filter(d => d?.id && d?.name).map(d => ({ value: String(d.id), label: d.name }))}
                  value={form.district}
                  onChange={v => setForm(p => ({ ...p, district: v }))}
                  placeholder={form.region ? 'Tumanni tanlang' : 'Avval viloyat tanlang'}
                  disabled={!form.region}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ko'cha *</label>
                  <input type="text" name="street" value={form.street}
                    onChange={handleChange} placeholder="Ko'cha nomi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Uy raqami *</label>
                  <input type="text" name="houseNumber" value={form.houseNumber}
                    onChange={handleChange} placeholder="12A" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {!loading && !registrationSuccess && step === 2 && (
            <div className="space-y-4">
              {/* Ma'lumotlar preview */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Ma'lumotlaringiz</p>

                <div className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="text-white/50 text-xs">Telefon</p>
                    <p className="text-white text-sm font-semibold">{form.phoneRequired}</p>
                    {form.phoneOptional && <p className="text-white/50 text-xs mt-0.5">{form.phoneOptional}</p>}
                  </div>
                </div>

                <div className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-white/50 text-xs">Manzil</p>
                    <p className="text-white text-sm font-semibold">{form.street}, {form.houseNumber}</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      {regions.find(r => r.id === parseInt(form.region))?.name},{' '}
                      {filteredDistricts.find(d => d.id === parseInt(form.district))?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer group">
                <input type="checkbox" checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-purple-500 cursor-pointer shrink-0" />
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                  Men{' '}
                  <a href="#" className="text-purple-300 underline hover:text-purple-200">Foydalanish shartlari</a>
                  {' '}va{' '}
                  <a href="#" className="text-purple-300 underline hover:text-purple-200">Maxfiylik siyosati</a>
                  {' '}ga roziman
                </span>
              </label>

              {/* OneID button */}
              <button
                onClick={handleRegister}
                disabled={!termsAccepted}
                className={`w-full relative group overflow-hidden rounded-2xl p-4 font-semibold text-base transition-all duration-300 ${
                  termsAccepted
                    ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white hover:shadow-xl hover:shadow-purple-500/40 active:scale-95'
                    : 'bg-white/10 border border-white/20 text-white/40 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                  OneID orqali tasdiqlash
                </div>
              </button>

              <p className="text-center text-blue-200/70 text-xs">
                ℹ️ id.egov.uz sahifasiga o'tasiz — pasport yoki ID karta bilan tasdiqlaysiz
              </p>
            </div>
          )}

          {/* NAV */}
          {!loading && !registrationSuccess && (
            <div className="mt-6 pt-5 border-t border-white/10 flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all">
                  ← Orqaga
                </button>
              )}
              {step === 1 && (
                <button onClick={handleNext} disabled={!step1Complete()}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    step1Complete()
                      ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                      : 'bg-white/10 border border-white/20 text-white/40 cursor-not-allowed'
                  }`}>
                  Keyingi qadam →
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-white/50 text-sm">
          Hisobingiz bormi?{' '}
          <button onClick={() => navigate('/login')} className="text-white font-semibold hover:text-purple-200 transition-colors">
            Kirish
          </button>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-white/40 text-xs text-center">
          {[['🛡️','Xavfsiz'],['📱','OneID'],['✓','Tezkor']].map(([icon, label]) => (
            <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="mb-1">{icon}</div>{label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
