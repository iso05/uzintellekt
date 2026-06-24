import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tokenStorage } from './token-storage'

describe('tokenStorage', () => {
  beforeEach(() => {
    document.cookie = 'access_token=; Max-Age=0; Path=/'
    document.cookie = 'refresh_token=; Max-Age=0; Path=/'
  })

  it('round-trips access token and computes expiry', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    tokenStorage.set('abc', 3600)
    expect(tokenStorage.get()).toBe('abc')
    expect(tokenStorage.getAccessExpiry()).toBe(now + 3600 * 1000)
  })

  it('falls back to default TTL when expiresIn is missing', () => {
    const now = 1_000_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    tokenStorage.set('abc')
    expect(tokenStorage.getAccessExpiry()).toBe(now + 3600 * 1000)
  })

  it('isAccessExpiring true when no token', () => {
    expect(tokenStorage.isAccessExpiring()).toBe(true)
  })

  it('isAccessExpiring true within leeway window', () => {
    const now = 1_000_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    tokenStorage.set('abc', 10)
    expect(tokenStorage.isAccessExpiring()).toBe(true)
  })

  it('isAccessExpiring false when access still valid past leeway', () => {
    const now = 1_000_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    tokenStorage.set('abc', 600)
    expect(tokenStorage.isAccessExpiring()).toBe(false)
  })

  it('isRefreshExpired true when no refresh', () => {
    expect(tokenStorage.isRefreshExpired()).toBe(true)
  })

  it('isRefreshExpired false when refresh in future', () => {
    const now = 1_000_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    tokenStorage.setRefresh('rt', 86400)
    expect(tokenStorage.isRefreshExpired()).toBe(false)
  })

  it('clear() wipes both tokens and expiries', () => {
    tokenStorage.set('a', 3600)
    tokenStorage.setRefresh('r', 86400)
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
    expect(tokenStorage.getRefresh()).toBeNull()
    expect(tokenStorage.getAccessExpiry()).toBeNull()
    expect(tokenStorage.getRefreshExpiry()).toBeNull()
  })
})
