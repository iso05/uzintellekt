import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getCached, setCached, invalidateCache, clearAllCache } from './cache'

describe('api cache', () => {
  beforeEach(() => clearAllCache())
  afterEach(() => vi.restoreAllMocks())

  it('stores and returns a value', () => {
    setCached('k', { a: 1 })
    expect(getCached('k')).toEqual({ a: 1 })
  })

  it('returns null once the TTL elapses', () => {
    const now = 1_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    setCached('k', 'v')
    Date.now.mockReturnValue(now + 31_000)
    expect(getCached('k')).toBeNull()
  })

  it('evicts the least-recently-used entry past the max size', () => {
    for (let i = 0; i < 100; i++) setCached('k' + i, i) // fills to MAX_ENTRIES (100)
    expect(getCached('k0')).toBe(0) // touch k0 → no longer the LRU
    setCached('k100', 100) // size exceeds max → evict the LRU (k1)

    expect(getCached('k0')).toBe(0) // survived (recently used)
    expect(getCached('k1')).toBeNull() // evicted
    expect(getCached('k100')).toBe(100)
  })

  it('invalidates only the matching endpoint prefix, not lookalikes', () => {
    setCached('/works/grid:{"page":1}', 'a')
    setCached('/works/grid:{"page":2}', 'b')
    setCached('/works/grid-export:{"page":1}', 'c')

    invalidateCache('/works/grid')

    expect(getCached('/works/grid:{"page":1}')).toBeNull()
    expect(getCached('/works/grid:{"page":2}')).toBeNull()
    expect(getCached('/works/grid-export:{"page":1}')).toBe('c') // not collided
  })
})
