import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestJson = vi.fn()
vi.mock('@shared/api', () => ({ requestJson: (...args) => requestJson(...args) }))
vi.mock('@/i18n', () => ({ default: { t: (key) => key } }))

import { updateMeField } from './api'

// The backend's UpdateUserRequest schema requires BOTH `address` and `phones` in PATCH requests.
// We verify that the payload contains address, phones, and pseudonym.
describe('updateMeField — complete payload to satisfy backend validation', () => {
  beforeEach(() => requestJson.mockReset())

  it('sends address, phones, and pseudonym since the backend requires address and phones', async () => {
    requestJson.mockImplementation((url, opts) => {
      if (!opts) {
        return Promise.resolve({
          address: 'Old address',
          phones: ['998901112233'],
          pseudonym: 'Old pen name',
        })
      }
      return Promise.resolve({})
    })

    await updateMeField('address', 'New address')

    const patch = requestJson.mock.calls.find(([, o]) => o?.method === 'PATCH')
    expect(patch).toBeTruthy()
    const body = JSON.parse(patch[1].body)

    expect(body).toEqual({
      address: 'New address',
      phones: ['998901112233'],
      pseudonym: 'Old pen name',
    })
  })
})
