import { useTranslation } from 'react-i18next'

// variant="mobile" — dark text, light bg (inside side menu drawer)
// variant="desktop" — white text, glassmorphic dropdown (navbar)
const LanguageSwitcher = ({ variant = 'desktop' }) => {
  const { i18n } = useTranslation()

  // Normalize language code to short form (uz, ru, en)
  const currentLang = i18n.language?.startsWith('ru')
    ? 'ru'
    : i18n.language?.startsWith('en')
    ? 'en'
    : 'uz'

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
          Til / Язык / Language
        </span>
        <div className="flex gap-2">
          {[
            { code: 'uz', label: 'Oʻzb' },
            { code: 'ru', label: 'Рус' },
            { code: 'en', label: 'Eng' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold border transition duration-200 ${
                currentLang === lang.code
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div className="relative inline-block">
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="appearance-none bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-2 pr-9 text-sm font-medium cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-300/50 backdrop-blur-md"
      >
        <option value="uz" className="text-gray-900 bg-white">UZ</option>
        <option value="ru" className="text-gray-900 bg-white">RU</option>
        <option value="en" className="text-gray-900 bg-white">EN</option>
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-[10px]">
        ▼
      </span>
    </div>
  )
}

export default LanguageSwitcher
