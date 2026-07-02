import { ENV } from '@shared/config/env'
import { tokenStorage } from './token-storage'

/**
 * Credential login for the admin panel. Runs OUTSIDE the request() interceptor
 * (there is no token yet), mirroring sso.js. On success the tokens are persisted
 * so every subsequent request() call is authenticated.
 */
export async function login(username, password) {
  const res = await fetch(`${ENV.API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.errorMessage || body.message || `Login xatosi: ${res.status}`)
    err.status = res.status
    err.apiError = body
    throw err
  }

  const data = await res.json()
  if (data.token) tokenStorage.set(data.token, data.expiresIn)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken, data.refreshExpiresIn)
  return data
}
