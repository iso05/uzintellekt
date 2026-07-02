import { describe, it, expect, afterEach, vi } from 'vitest'
import { safeLocalStorage } from './safe-storage'

describe('safeLocalStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('reads and writes normally', () => {
    safeLocalStorage.setItem('k', 'v')
    expect(safeLocalStorage.getItem('k')).toBe('v')
  })

  it('does not throw when setItem fails (quota / private mode)', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => safeLocalStorage.setItem('k', 'v')).not.toThrow()
  })

  it('returns null when getItem throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(safeLocalStorage.getItem('k')).toBeNull()
  })
})
