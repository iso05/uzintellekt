import { describe, it, expect, vi, beforeEach } from 'vitest'

const getWorksStat = vi.fn()
const getWorks = vi.fn()
vi.mock('../api', () => ({
  getWorksStat: (...args) => getWorksStat(...args),
  getWorks: (...args) => getWorks(...args),
}))

import { getWorksStats } from './use-cases'

// getWorksStats now reads GET /api/v1/works/stat (one role-scoped aggregate)
// and flattens byStatus into the flat keys the WorksStats cards consume.
describe('getWorksStats — maps /works/stat into the dashboard shape', () => {
  beforeEach(() => getWorksStat.mockReset())

  it('flattens total and the consumed byStatus counts', async () => {
    getWorksStat.mockResolvedValue({
      total: 42,
      byStatus: { DRAFT: 10, UNDER_REVIEW: 7, REGISTERED: 20, REJECTED: 3 },
    })

    expect(await getWorksStats()).toEqual({
      total: 42,
      registered: 20,
      pending: 7,
      rejected: 3,
    })
  })

  it('zero-fills missing counts', async () => {
    getWorksStat.mockResolvedValue({ total: 0 })

    expect(await getWorksStats()).toEqual({
      total: 0,
      registered: 0,
      pending: 0,
      rejected: 0,
    })
  })

  it('coerces non-numeric counts to 0', async () => {
    getWorksStat.mockResolvedValue({ total: '5', byStatus: { REGISTERED: null } })

    const result = await getWorksStats()
    expect(result.total).toBe(5)
    expect(result.registered).toBe(0)
  })

  it('lets a failed request propagate to the caller', async () => {
    getWorksStat.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    await expect(getWorksStats()).rejects.toThrow('boom')
  })
})
