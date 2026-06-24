import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'

const LANGS = [
  { code: 'uz', label: 'Oʻzbek', short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
]

const LanguageSwitcher = ({ variant = 'desktop' }) => {
  const { i18n } = useTranslation()

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
        <span className="select-none text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Til / Язык / Language
        </span>
        <div className="flex gap-2">
          {LANGS.map((lang) => {
            const active = currentLang === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                {lang.short}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger className="h-9 w-[88px] gap-1.5 px-3 text-sm">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGS.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.short}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher
