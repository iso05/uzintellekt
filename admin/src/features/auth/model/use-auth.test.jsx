import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Force the real (non-test) auth path so the ADMIN gate actually runs — otherwise
// TEST_MODE from .env.local would mount a mock admin and bypass the gate entirely.
vi.mock('@shared/config/env', () => ({
  ENV: { TEST_MODE: false, API_BASE_URL: 'http://test' },
  getMainSite: () => 'http://test',
}))

// http.js touches window.location on auth failures; the real credential login is
// mocked here so these tests exercise only the ADMIN gate, not the network.
vi.mock('@shared/api', () => ({
  login: vi.fn(),
  tryRefreshSilently: vi.fn(),
  tokenStorage: {
    get: vi.fn(() => null),
    getRefresh: vi.fn(() => null),
    isRefreshExpired: vi.fn(() => true),
    isAccessExpiring: vi.fn(() => false),
    clear: vi.fn(),
  },
}))

vi.mock('@/entities/user', async (importActual) => {
  const actual = await importActual()
  return { ...actual, getMe: vi.fn() }
})

import { login as apiLogin, tokenStorage } from '@shared/api'
import { getMe } from '@/entities/user'
import { AuthProvider, useAuth, NotAdminError } from './use-auth'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

async function renderAuth() {
  const view = renderHook(() => useAuth(), { wrapper })
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

describe('useAuth login gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStorage.get.mockReturnValue(null)
    tokenStorage.getRefresh.mockReturnValue(null)
    tokenStorage.isRefreshExpired.mockReturnValue(true)
  })

  it('starts logged out when there is no token', async () => {
    const { result } = await renderAuth()

    expect(result.current.user).toBeNull()
  })

  it('signs in an ADMIN user', async () => {
    apiLogin.mockResolvedValue({ token: 't', refreshToken: 'r' })
    getMe.mockResolvedValue({ id: '1', username: 'root', role: 'ADMIN', state: 'ACTIVE' })

    const { result } = await renderAuth()
    await act(async () => {
      await result.current.login('root', 'secret')
    })

    expect(apiLogin).toHaveBeenCalledWith('root', 'secret')
    expect(result.current.user).toMatchObject({ role: 'ADMIN', username: 'root' })
  })

  it('rejects a non-admin and drops the session', async () => {
    apiLogin.mockResolvedValue({ token: 't', refreshToken: 'r' })
    getMe.mockResolvedValue({ id: '2', username: 'joe', role: 'USER', state: 'ACTIVE' })

    const { result } = await renderAuth()

    let thrown
    await act(async () => {
      thrown = await result.current.login('joe', 'secret').catch((e) => e)
    })

    expect(thrown).toBeInstanceOf(NotAdminError)
    expect(thrown.code).toBe('NOT_ADMIN')
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
  })
})
