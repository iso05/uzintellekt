import { describe, it, expect } from 'vitest'
import { resolveValidationError } from './validation-error'

// Fake i18n.t: echoes the key, and appends interpolation params so we can assert
// what got passed through. A real t() would substitute {{field}} etc.
const t = (key, params) => (params ? `${key}|${JSON.stringify(params)}` : key)

describe('resolveValidationError', () => {
  it('returns null for no error', () => {
    expect(resolveValidationError(t, null)).toBeNull()
    expect(resolveValidationError(t, undefined)).toBeNull()
  })

  it('passes plain strings through unchanged (e.g. backend messages)', () => {
    expect(resolveValidationError(t, 'Server is down')).toBe('Server is down')
  })

  it('translates a bare key descriptor', () => {
    expect(resolveValidationError(t, { key: 'validation.passport_required' })).toBe(
      'validation.passport_required'
    )
  })

  it('interpolates scalar params', () => {
    expect(resolveValidationError(t, { key: 'validation.share_total', params: { n: 80 } })).toBe(
      'validation.share_total|{"n":80}'
    )
  })

  it('translates a nested descriptor param (field label) before interpolating', () => {
    const result = resolveValidationError(t, {
      key: 'validation.field_required',
      params: { field: { key: 'validation.field_work_name' } },
    })
    expect(result).toBe('validation.field_required|{"field":"validation.field_work_name"}')
  })
})
