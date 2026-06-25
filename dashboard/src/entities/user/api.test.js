import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestJson = vi.fn()
vi.mock('@/shared/api', () => ({ requestJson: (...args) => requestJson(...args) }))
vi.mock('@/i18n', () => ({ default: { t: (key) => key } }))

import { updateMeField } from './api'

// Bug #5: updateMeField does a non-atomic read-modify-write — it GETs the whole
// user, rebuilds a full payload from that (possibly stale) snapshot, and PATCHes
// every field back. A concurrent edit to a different field is silently clobbered
// by the stale snapshot. A PATCH should send only the field(s) being changed.
describe('updateMeField — partial update, no stale-snapshot clobber', () => {
  beforeEach(() => requestJson.mockReset())

  it('does not resend unrelated fields from the GET snapshot when changing address', async () => {
    requestJson.mockImplementation((url, opts) => {
      // GET /users/me — a snapshot that may predate a concurrent phones/pseudonym edit
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

    // Only the changed field should travel; resending stale phones/pseudonym is
    // exactly how a concurrent edit gets reverted.
    expect(body).toEqual({ address: 'New address' })
  })
})
