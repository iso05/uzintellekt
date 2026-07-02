import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/api', () => ({
  requestJson: vi.fn(),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
}))

import { requestJson, invalidateCache } from '@shared/api'
import { createWorkForUser, updateWork, submitWork } from './api'

const WORKS_GRID = '/api/v1/works/grid'

describe('work mutations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createWorkForUser POSTs to the per-user works endpoint and invalidates', async () => {
    requestJson.mockResolvedValue({ id: 'w1' })
    const payload = { name: 'W', workTypeId: 1, rightHolders: [] }

    const created = await createWorkForUser('u1', payload)

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/users/u1/works', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    expect(invalidateCache).toHaveBeenCalledWith(WORKS_GRID)
    expect(created).toEqual({ id: 'w1' })
  })

  it('updateWork PATCHes the admin work endpoint and invalidates', async () => {
    requestJson.mockResolvedValue({ id: 'w1' })
    const payload = { name: 'W2', workTypeId: 2, rightHolders: [] }

    await updateWork('w1', payload)

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/works/w1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    expect(invalidateCache).toHaveBeenCalledWith(WORKS_GRID)
  })

  it('submitWork POSTs to the submit endpoint and invalidates', async () => {
    requestJson.mockResolvedValue(null)

    await submitWork('w1')

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/works/w1/submit', { method: 'POST' })
    expect(invalidateCache).toHaveBeenCalledWith(WORKS_GRID)
  })
})
