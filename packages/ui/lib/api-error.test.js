import { describe, it, expect } from 'vitest'
import { apiErrorMessage } from './api-error'

const t = (key) => key // identity — assert the chosen key

describe('apiErrorMessage', () => {
  it('maps known backend error codes to localized keys', () => {
    expect(apiErrorMessage({ apiError: { errorCode: 1015 } }, t)).toBe('errors.quota_exceeded')
    expect(apiErrorMessage({ apiError: { errorCode: 1020 } }, t)).toBe('errors.rate_limit')
    expect(apiErrorMessage({ apiError: { errorCode: 1021 } }, t)).toBe('errors.draft_limit')
    expect(apiErrorMessage({ apiError: { errorCode: 1022 } }, t)).toBe('errors.submit_no_file')
  })

  it('falls back to the raw message for unknown codes', () => {
    expect(apiErrorMessage({ apiError: { errorCode: 9999 }, message: 'boom' }, t)).toBe('boom')
    expect(apiErrorMessage({ message: 'plain' }, t)).toBe('plain')
  })

  it('falls back to the provided key when there is no message', () => {
    expect(apiErrorMessage({}, t, 'work_actions.submit_err')).toBe('work_actions.submit_err')
  })
})
