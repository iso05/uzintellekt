import { requestJson, cachedGridGet, invalidateCache } from '@/shared/api'
import i18n from '@/i18n'

const WORKS_GRID = '/api/v1/works/grid'

export async function getWorks({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true },
} = {}) {
  return cachedGridGet(WORKS_GRID, { page, size, filters, sort })
}

export async function getWork(workId) {
  const data = await cachedGridGet(WORKS_GRID, {
    page: 1,
    size: 1,
    filters: [{ field: 'id', operator: 'eq', value: workId }],
  })
  const items = data?.items ?? []
  if (!items.length) throw new Error(i18n.t('works.not_found'))
  return items[0]
}

export async function createWork(payload) {
  const data = await requestJson('/api/v1/works', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  invalidateCache(WORKS_GRID)
  return data
}

export async function updateWork(workId, payload) {
  const data = await requestJson(`/api/v1/works/${workId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  invalidateCache(WORKS_GRID)
  return data
}

export async function submitWork(workId) {
  const data = await requestJson(`/api/v1/works/${workId}/submit`, { method: 'POST' })
  invalidateCache(WORKS_GRID)
  return data
}

export async function cancelWork(workId) {
  const data = await requestJson(`/api/v1/works/${workId}/cancel`, { method: 'PATCH' })
  invalidateCache(WORKS_GRID)
  return data
}

export async function getMyContributions() {
  const data = await requestJson('/api/v1/works/my-contributions')
  // Always hand back an array — other list loaders defensively unwrap items/
  // content shapes, and ContributionsTable.map would throw on a wrapped object.
  if (Array.isArray(data)) return data
  return data?.items ?? data?.content ?? data?.data?.items ?? []
}

export async function getWorkTypes() {
  return requestJson('/api/v1/dictionaries/work-types')
}

export async function getAuthorRoles() {
  return requestJson('/api/v1/dictionaries/author-roles')
}
