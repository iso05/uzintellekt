import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from './format'

describe('formatDate / formatDateTime — one consistent template', () => {
  it('normalizes the backend "DD.MM.YYYY HH:MM:SS" shape (drops seconds)', () => {
    expect(formatDateTime('25.06.2026 10:33:23')).toBe('25.06.2026 10:33')
    expect(formatDate('25.06.2026 10:33:23')).toBe('25.06.2026')
  })

  it('handles the backend date-only shape', () => {
    expect(formatDate('30.06.2026')).toBe('30.06.2026')
    expect(formatDateTime('30.06.2026')).toBe('30.06.2026 00:00')
  })

  it('handles ISO 8601 the same way (no seconds, DD.MM.YYYY)', () => {
    expect(formatDateTime('2026-06-30T17:39:10')).toBe('30.06.2026 17:39')
    expect(formatDate('2026-06-30T17:39:10')).toBe('30.06.2026')
  })

  it('created and updated from the backend render in the identical template', () => {
    // Regression: previously non-ISO fell through to the raw string (with seconds)
    // while ISO was reformatted → two different templates on one page.
    const created = formatDateTime('25.06.2026 10:33:23')
    const updated = formatDateTime('2026-06-30T17:39:10')
    const shape = (s) => s.replace(/\d/g, '#')
    expect(shape(created)).toBe(shape(updated)) // ##.##.#### ##:##
  })

  it('handles single-digit day/month/hour without swapping', () => {
    expect(formatDate('5.6.2026')).toBe('05.06.2026')
    expect(formatDateTime('5.6.2026 9:03')).toBe('05.06.2026 09:03')
    expect(formatDateTime('25.06.2026 9:33:23')).toBe('25.06.2026 09:33')
  })

  it('does NOT guess MM/DD for slash/other shapes — renders raw, never a swapped date', () => {
    expect(formatDate('01/02/2026')).toBe('01/02/2026')
  })

  it('empty → dash, unparseable → raw', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('not a date')).toBe('not a date')
  })
})
