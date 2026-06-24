import { ENV } from '@/shared/config/env'
import { tokenStorage } from './token-storage'

export async function loginWithOneIdCode(authCode) {
  const res = await fetch(`${ENV.API_BASE_URL}/api/v1/auth/sso/one-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authCode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errorMessage || `Login xatosi: ${res.status}`)
  }
  const data = await res.json()
  if (data.token) tokenStorage.set(data.token, data.expiresIn)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken, data.refreshExpiresIn)
  return data
}
