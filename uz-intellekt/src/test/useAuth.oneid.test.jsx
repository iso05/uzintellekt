import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Capture the OneID redirect instead of letting jsdom attempt navigation.
let locationMock

function parseRedirect() {
  const url = new URL(locationMock.href)
  return {
    href: locationMock.href,
    state: url.searchParams.get('state'),
    redirectUri: url.searchParams.get('redirect_uri'),
    clientId: url.searchParams.get('client_id'),
  }
}

beforeEach(() => {
  locationMock = { href: '', replace: vi.fn() }
  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('OneID login — CSRF state', () => {
  it('stores the state it sends, so the callback CSRF check can succeed', async () => {
    const { AuthProvider, useAuth } = await import('@/hooks/useAuth')
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.loginWithOneId()
    })

    const { state } = parseRedirect()

    // The state placed in the redirect URL must be persisted so the callback
    // can validate it. Today nothing writes `oneid_state`, so this is null.
    const savedState = sessionStorage.getItem('oneid_state')
    expect(savedState).not.toBeNull()
    expect(savedState).toBe(state)
  })

  it('callback does not throw a CSRF error for the state we just sent', async () => {
    vi.doMock('@/services/api', () => ({
      loginWithOneIdCode: vi.fn().mockResolvedValue({}),
      getMe: vi.fn().mockResolvedValue({ id: 1, isMember: true }),
      tokenStorage: { get: vi.fn(() => null), set: vi.fn(), clear: vi.fn() },
    }))
    const { AuthProvider, useAuth } = await import('@/hooks/useAuth')
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.loginWithOneId()
    })
    const { state } = parseRedirect()

    // Simulate OneID returning with a valid code and the same state.
    await expect(
      result.current.handleCallback('valid-code', state)
    ).resolves.toMatchObject({ isMember: true })

    vi.doUnmock('@/services/api')
  })
})

describe('OneID login — config source', () => {
  it('builds the redirect from configured env, not hardcoded prod values', async () => {
    vi.stubEnv('VITE_ONEID_CLIENT_ID', 'test_client_id')
    vi.stubEnv('VITE_ONEID_REDIRECT_URI', 'http://localhost:5174/login')
    vi.resetModules()

    const { AuthProvider, useAuth } = await import('@/hooks/useAuth')
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.loginWithOneId()
    })

    const { redirectUri, clientId } = parseRedirect()
    expect(redirectUri).toBe('http://localhost:5174/login')
    expect(clientId).toBe('test_client_id')
  })
})
