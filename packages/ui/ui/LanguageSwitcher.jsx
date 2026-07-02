import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui'

const LANGS = [
  { code: 'uz-Cyrl', short: 'ЎЗ' },
  { code: 'uz', short: 'UZ' },
  { code: 'ru', short: 'RU' },
  { code: 'en', short: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const lng = i18n.language || 'uz-Cyrl'
  const current = lng.startsWith('uz-Cyrl')
    ? 'uz-Cyrl'
    : lng.startsWith('ru')
      ? 'ru'
      : lng.startsWith('en')
        ? 'en'
        : lng.startsWith('uz')
          ? 'uz'
          : 'uz-Cyrl'

  return (
    <Select value={current} onValueChange={(v) => i18n.changeLanguage(v)}>
      <SelectTrigger className="h-9 w-auto min-w-[88px] gap-1.5 px-2.5 text-sm">
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.short}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
