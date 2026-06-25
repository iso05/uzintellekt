import i18n from '@/i18n'
import { transliterateUzLatinToCyrillic } from './transliterate'

/**
 * Resolves a backend `localizedName` ({ uz, ru, en }) to the current UI
 * language. The backend ships no Cyrillic, so for the uz-Cyrl UI the Latin uz
 * value is transliterated. Falls back uz → ru → en → fallbackName.
 */
export function resolveLocalizedName(localizedName, fallbackName = '') {
  const ln = localizedName || {}
  const lang = i18n.language || 'uz-Cyrl'

  if (lang.startsWith('ru') && ln.ru) return ln.ru
  if (lang.startsWith('en') && ln.en) return ln.en

  const uz = ln.uz || ln.ru || ln.en || fallbackName || ''
  if (/^uz-cyrl$/i.test(lang)) return uz ? transliterateUzLatinToCyrillic(uz) : ''
  return uz
}
