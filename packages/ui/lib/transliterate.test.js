import { describe, it, expect } from 'vitest'
import { transliterateUzLatinToCyrillic } from './transliterate'

describe('transliterateUzLatinToCyrillic', () => {
  it('returns falsy input unchanged', () => {
    expect(transliterateUzLatinToCyrillic('')).toBe('')
    expect(transliterateUzLatinToCyrillic(null)).toBeNull()
  })

  it('transliterates native dictionary terms', () => {
    expect(transliterateUzLatinToCyrillic('Ilmiy asar')).toBe('Илмий асар')
    expect(transliterateUzLatinToCyrillic('Adabiy asar')).toBe('Адабий асар')
    expect(transliterateUzLatinToCyrillic('Musiqiy asar')).toBe('Мусиқий асар')
    expect(transliterateUzLatinToCyrillic('Haykaltaroshlik')).toBe('Ҳайкалтарошлик')
    expect(transliterateUzLatinToCyrillic('Arxitektura asari')).toBe('Архитектура асари')
  })

  it('handles oʻ / gʻ digraphs with the modifier apostrophe', () => {
    expect(transliterateUzLatinToCyrillic('Koʻrsatuv yoki eshittirish')).toBe(
      'Кўрсатув ёки эшиттириш'
    )
    expect(transliterateUzLatinToCyrillic("bog'")).toBe('боғ')
  })

  it('handles yo / yu / ya / ye digraphs', () => {
    expect(transliterateUzLatinToCyrillic('Ijro yozuvi')).toBe('Ижро ёзуви')
    expect(transliterateUzLatinToCyrillic('Yer')).toBe('Ер')
  })

  it('maps the tutuq belgisi (apostrophe) to ъ', () => {
    expect(transliterateUzLatinToCyrillic("ma'lumot")).toBe('маълумот')
  })

  it('uses э for word-initial e and е elsewhere', () => {
    expect(transliterateUzLatinToCyrillic('EHM dasturi')).toBe('ЭҲМ дастури')
    expect(transliterateUzLatinToCyrillic('Video')).toBe('Видео')
  })

  it('preserves non-letters and casing', () => {
    expect(transliterateUzLatinToCyrillic('Fonogramma 2')).toBe('Фонограмма 2')
  })
})
