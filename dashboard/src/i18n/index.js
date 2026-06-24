import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import uzCyrl from './uz-Cyrl.json'
import uz from './uz.json'
import ru from './ru.json'
import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uz-Cyrl',
    supportedLngs: ['uz-Cyrl', 'uz', 'ru', 'en'],
    load: 'currentOnly',
    defaultNS: 'translation',
    ns: ['translation'],
    resources: {
      'uz-Cyrl': { translation: uzCyrl },
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], caches: ['localStorage'] },
  })

export default i18n
