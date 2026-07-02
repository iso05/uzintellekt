import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'

// Current authenticated user — used by the auth gate to read role/state.
export function getMe() {
  return requestJson('/api/v1/users/me')
}

const USERS_GRID = '/api/v1/admin/users/grid'

export function getUsersGrid({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true },
} = {}) {
  return cachedGridGet(USERS_GRID, { page, size, filters, sort })
}

export function getUserById(userId) {
  return requestJson(`/api/v1/admin/users/${userId}`)
}

export async function createUser(payload) {
  const data = await requestJson('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  invalidateCache(USERS_GRID)
  return data
}

export async function updateUser(userId, payload) {
  const data = await requestJson(`/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  invalidateCache(USERS_GRID)
  return data
}

export async function blockUser(userId) {
  await requestJson(`/api/v1/admin/users/${userId}/block`, { method: 'PATCH' })
  invalidateCache(USERS_GRID)
}

export async function activateUser(userId) {
  await requestJson(`/api/v1/admin/users/${userId}/activate`, { method: 'PATCH' })
  invalidateCache(USERS_GRID)
}
