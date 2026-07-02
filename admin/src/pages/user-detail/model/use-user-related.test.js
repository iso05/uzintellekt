import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const getWorksGrid = vi.fn()
const getContractsGrid = vi.fn()
vi.mock('@/entities/work', () => ({ getWorksGrid: (...a) => getWorksGrid(...a) }))
vi.mock('@/entities/contract', () => ({ getContractsGrid: (...a) => getContractsGrid(...a) }))

import { useUserWorks, useUserContracts, RELATED_PAGE_SIZE } from './use-user-related'

describe('user-related lists', () => {
  beforeEach(() => {
    getWorksGrid.mockReset().mockResolvedValue({ items: [{ id: 'w1' }], totalItems: 1, totalPages: 1 })
    getContractsGrid.mockReset().mockResolvedValue({ items: [{ id: 'c1' }], totalItems: 1, totalPages: 1 })
  })

  it('useUserWorks pages works filtered by createdBy', async () => {
    const { result } = renderHook(() => useUserWorks('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getWorksGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: RELATED_PAGE_SIZE,
        filters: [{ field: 'createdBy', operator: 'eq', value: 'u1' }],
      })
    )
    expect(result.current.items).toEqual([{ id: 'w1' }])
    expect(result.current.totalItems).toBe(1)
  })

  it('useUserContracts pages contracts filtered by userId', async () => {
    const { result } = renderHook(() => useUserContracts('u1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getContractsGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        size: RELATED_PAGE_SIZE,
        filters: [{ field: 'userId', operator: 'eq', value: 'u1' }],
      })
    )
    expect(result.current.items).toEqual([{ id: 'c1' }])
  })
})
