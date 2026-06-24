// src/services/worksApi.js
import { request } from './api'
import { cachedGridGet } from '../utils/cachedGridRequest'
import { invalidateCache } from '../utils/apiCache'

async function json(res) {
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return null
}

// ── Works (User space) ───────────────────────────────────────────
// Load paginated works list
export async function getWorks({ page = 1, size = 10, filters = [], sort = { selector: 'createdAt', desc: true } } = {}) {
  return cachedGridGet('/api/v1/works/grid', { page, size, filters, sort })
}

// Legacy wrapper to support other imports if needed
export async function getWorksGrid({ page = 1, size = 10, sorts = [], filters = [] } = {}) {
  const sort = sorts?.[0] || { selector: 'createdAt', desc: true }
  return getWorks({ page, size, filters, sort })
}

// Load single work by id (NO GET endpoint exists — use grid)
export async function getWork(workId) {
  const data = await cachedGridGet('/api/v1/works/grid', {
    page: 1,
    size: 1,
    filters: [{ field: 'id', operator: 'eq', value: workId }]
  })
  const items = data?.items ?? []
  if (!items.length) throw new Error('Asar topilmadi')
  return items[0]
}

// Create work
export async function createWork(payload) {
  const res = await request('/api/v1/works', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  invalidateCache('/api/v1/works/grid')
  return json(res)
}

// Update work (DRAFT only)
export async function updateWork(workId, payload) {
  const res = await request(`/api/v1/works/${workId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  invalidateCache('/api/v1/works/grid')
  return json(res)
}

// Submit work for review (DRAFT → PENDING)
export async function submitWork(workId) {
  const res = await request(`/api/v1/works/${workId}/submit`, {
    method: 'POST',
  })
  invalidateCache('/api/v1/works/grid')
  return json(res)
}

// Cancel work (DRAFT only — user side)
export async function cancelWork(workId) {
  const res = await request(`/api/v1/works/${workId}/cancel`, {
    method: 'PATCH',
  })
  invalidateCache('/api/v1/works/grid')
  return json(res)
}

// My contributions (works where user is right holder but did not create)
export async function getMyContributions() {
  const res = await request('/api/v1/works/my-contributions')
  return json(res)
}

// ── Dictionaries ─────────────────────────────────────────────────
/** GET /api/v1/dictionaries/work-types */
export async function getWorkTypes() {
  const res = await request('/api/v1/dictionaries/work-types')
  return json(res)
}

/** GET /api/v1/dictionaries/author-roles */
export async function getAuthorRoles() {
  const res = await request('/api/v1/dictionaries/author-roles')
  return json(res)
}
