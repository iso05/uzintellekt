import { describe, it, expect, beforeAll } from 'vitest'
import i18n, { createI18n } from '@shared/i18n'
import { resolveLocalizedName } from './localized-name'

// resolveLocalizedName reads the live language from the shared i18n instance, so
// the tests switch language via i18n.changeLanguage before each assertion group.
beforeAll(() => {
  if (!i18n.isInitialized) createI18n({ 'uz-Cyrl': {}, uz: {}, ru: {}, en: {} })
})

const LN = { uz: "Ko'rsatuv yoki eshittirish", ru: 'Показ или передача', en: 'Show or broadcast' }

describe('resolveLocalizedName', () => {
  it('transliterates the Latin uz value for the default uz-Cyrl UI', async () => {
    await i18n.changeLanguage('uz-Cyrl')
    // o' → ў, yo → ё, sh → ш, word-initial e → э; native words convert cleanly.
    expect(resolveLocalizedName(LN)).toBe('Кўрсатув ёки эшиттириш')
  })

  it('returns the raw Latin uz value for the uz (Latin) UI', async () => {
    await i18n.changeLanguage('uz')
    expect(resolveLocalizedName(LN)).toBe("Ko'rsatuv yoki eshittirish")
  })

  it('returns the ru value for the ru UI', async () => {
    await i18n.changeLanguage('ru')
    expect(resolveLocalizedName(LN)).toBe('Показ или передача')
  })

  it('returns the en value for the en UI', async () => {
    await i18n.changeLanguage('en')
    expect(resolveLocalizedName(LN)).toBe('Show or broadcast')
  })

  it('is idempotent on already-Cyrillic input under uz-Cyrl', async () => {
    await i18n.changeLanguage('uz-Cyrl')
    const cyr = { uz: 'Кино' }
    expect(resolveLocalizedName(cyr)).toBe('Кино')
  })

  it('falls back to the provided fallbackName when localizedName is empty', async () => {
    await i18n.changeLanguage('en')
    expect(resolveLocalizedName(null, 'Fallback')).toBe('Fallback')
    expect(resolveLocalizedName(undefined, 'Fallback')).toBe('Fallback')
  })

  it('transliterates the fallbackName under uz-Cyrl when no localizedName', async () => {
    await i18n.changeLanguage('uz-Cyrl')
    expect(resolveLocalizedName({}, 'Kino')).toBe('Кино')
  })
})
