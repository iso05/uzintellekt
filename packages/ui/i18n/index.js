import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Shared i18n setup. Each app calls createI18n() once (from its own
// src/i18n/index.js) with its own translation resources; the configured
// instance is the module default export, so shared modules that need the live
// instance (e.g. lib/localized-name.js) can `import i18n from '@shared/i18n'`.
export function createI18n(resources) {
  const packaged = Object.fromEntries(
    Object.entries(resources).map(([lng, translation]) => [lng, { translation }])
  )

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'uz-Cyrl',
      supportedLngs: ['uz-Cyrl', 'uz', 'ru', 'en'],
      load: 'currentOnly',
      defaultNS: 'translation',
      ns: ['translation'],
      resources: packaged,
      interpolation: { escapeValue: false },
      detection: { order: ['localStorage'], caches: ['localStorage'] },
    })

  return i18n
}

export default i18n
