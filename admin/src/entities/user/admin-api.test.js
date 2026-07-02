import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/api', () => ({
  requestJson: vi.fn(),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
}))

import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'
import { getUsersGrid, createUser, updateUser, blockUser, activateUser } from './api'

const USERS_GRID = '/api/v1/admin/users/grid'

describe('admin user api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getUsersGrid passes paging/filters to the grid endpoint', () => {
    cachedGridGet.mockResolvedValue({ items: [] })
    getUsersGrid({ page: 2, size: 10, filters: [{ field: 'role', operator: 'eq', value: 'USER' }] })
    expect(cachedGridGet).toHaveBeenCalledWith(USERS_GRID, {
      page: 2,
      size: 10,
      filters: [{ field: 'role', operator: 'eq', value: 'USER' }],
      sort: { selector: 'createdAt', desc: true },
    })
  })

  it('createUser POSTs the payload and invalidates the grid', async () => {
    requestJson.mockResolvedValue({ id: 'u1' })
    const payload = { type: 'INDIVIDUAL', firstName: 'A', lastName: 'B', address: 'X' }

    const created = await createUser(payload)

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    expect(invalidateCache).toHaveBeenCalledWith(USERS_GRID)
    expect(created).toEqual({ id: 'u1' })
  })

  it('updateUser PATCHes the user and invalidates the grid', async () => {
    requestJson.mockResolvedValue({ id: 'u1', role: 'MODERATOR' })
    const payload = { role: 'MODERATOR', address: 'X', phones: ['998900000000'] }

    await updateUser('u1', payload)

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/users/u1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    expect(invalidateCache).toHaveBeenCalledWith(USERS_GRID)
  })

  it('blockUser and activateUser hit their PATCH endpoints and invalidate the grid', async () => {
    requestJson.mockResolvedValue(null)

    await blockUser('u1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/users/u1/block', { method: 'PATCH' })

    await activateUser('u2')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/users/u2/activate', { method: 'PATCH' })

    expect(invalidateCache).toHaveBeenCalledTimes(2)
    expect(invalidateCache).toHaveBeenCalledWith(USERS_GRID)
  })
})
