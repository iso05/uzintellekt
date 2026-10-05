import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'
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

export function normalizeWork(item) {
  if (!item) return null
  if (item.work) {
    const inner = item.work
    const realId = inner.id || item.workId || item.id
    const rawType = inner.workTypeId ?? item.workTypeId ?? inner.workType ?? item.workType ?? inner.type ?? item.type
    const typeVal = typeof rawType === 'object' ? (rawType.id || rawType) : rawType
    return {
      ...inner,
      ...item,
      id: realId,
      workId: realId,
      name: inner.name ?? item.name,
      description: inner.description ?? item.description,
      workTypeId: typeVal,
      state: inner.state ?? item.state,
      rightHolders: inner.rightHolders ?? item.rightHolders,
      createdAt: inner.createdAt ?? item.createdAt,
      updatedAt: inner.updatedAt ?? item.updatedAt,
    }
  }
  const rawType = item.workTypeId ?? item.workType ?? item.type
  const typeVal = typeof rawType === 'object' ? (rawType.id || rawType) : rawType
  return {
    ...item,
    workTypeId: typeVal,
  }
}

export async function getWork(workId) {
  if (!workId) throw new Error(i18n.t('works.not_found'))
  const targetId = String(workId).trim().toLowerCase()
  console.group(`🔍 getWork: "${workId}"`)

  // 1. Search in user's own works grid (/api/v1/works/grid) with eq filter
  try {
    const gridData = await cachedGridGet(WORKS_GRID, {
      page: 1,
      size: 1,
      filters: [{ field: 'id', operator: 'eq', value: workId }],
    })
    const items = gridData?.items ?? []
    if (items.length > 0) {
      const normalized = normalizeWork(items[0])
      if (normalized.rightHolders && normalized.rightHolders.length > 0) {
        console.log('✅ getWork match in WORKS_GRID eq filter:', normalized)
        console.groupEnd()
        return normalized
      }
    }
  } catch (err) {
    console.warn('WORKS_GRID filtered lookup failed:', err)
  }

  // 2. Search in co-author contributions (/api/v1/works/my-contributions)
  try {
    const contribs = await getMyContributions()
    const rawItem = (contribs || []).find((c) => {
      const ids = [c.id, c.workId, c.work?.id, c.work?.workId].filter(Boolean).map((v) => String(v).trim().toLowerCase())
      return ids.includes(targetId)
    })
    if (rawItem) {
      const normalized = normalizeWork(rawItem)
      console.log('✅ getWork match in getMyContributions:', normalized)
      console.groupEnd()
      return normalized
    }
  } catch (err) {
    console.warn('getMyContributions lookup failed:', err)
  }

  // 3. Fallback: recent user works list (/api/v1/works/grid page 1 size 100)
  try {
    const allUserWorks = await cachedGridGet(WORKS_GRID, { page: 1, size: 100 })
    const userItems = allUserWorks?.items ?? []
    const ownItem = userItems.find((w) => {
      const ids = [w.id, w.workId].filter(Boolean).map((v) => String(v).trim().toLowerCase())
      return ids.includes(targetId)
    })
    if (ownItem) {
      const normalized = normalizeWork(ownItem)
      console.log('✅ getWork match in WORKS_GRID list:', normalized)
      console.groupEnd()
      return normalized
    }
  } catch (err) {
    console.warn('WORKS_GRID list lookup failed:', err)
  }

  console.error(`🔴 getWork: "${workId}" topilmadi!`)
  console.groupEnd()
  throw new Error(i18n.t('works.not_found'))
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

// Soft-delete (backend enforces DRAFT/REJECTED only). Returns 204 (no body).
export async function deleteWork(workId) {
  await requestJson(`/api/v1/works/${workId}`, { method: 'DELETE' })
  invalidateCache(WORKS_GRID)
}

export async function getWorksStat() {
  // Role-scoped aggregate (admin: all works, user: own). Not cached: it is
  // loaded once per dashboard mount and must reflect mutations made since.
  return requestJson('/api/v1/works/stat')
}

export async function getMyContributions() {
  const data = await requestJson('/api/v1/works/my-contributions')
  const rawArray = Array.isArray(data) ? data : (data?.items ?? data?.content ?? data?.data?.items ?? [])
  return rawArray.map(normalizeWork)
}

// Rights holders see the redacted composition, uploaded work files, and only
// their own supporting documents through this dedicated view.
export function getConsentView(workId) {
  return requestJson(`/api/v1/works/${workId}/consent-view`)
}

export function getConsentViewFileDownloadUrl(workId, fileId) {
  return requestJson(`/api/v1/works/${workId}/consent-view/files/${fileId}/download-url`)
}

export function getConsentViewDocumentDownloadUrl(workId, documentId) {
  return requestJson(`/api/v1/works/${workId}/consent-view/documents/${documentId}/download-url`)
}

export async function acceptConsent(workId) {
  const data = await requestJson(`/api/v1/works/${workId}/consent/accept`, { method: 'POST' })
  invalidateCache(WORKS_GRID)
  return data
}

export async function rejectConsent(workId, reasonId) {
  const data = await requestJson(`/api/v1/works/${workId}/consent/reject`, {
    method: 'POST',
    body: JSON.stringify({ reasonId: Number(reasonId) }),
  })
  invalidateCache(WORKS_GRID)
  return data
}

export async function withdrawWork(workId) {
  const data = await requestJson(`/api/v1/works/${workId}/withdraw`, { method: 'POST' })
  invalidateCache(WORKS_GRID)
  return data
}

export async function getWorkTypes() {
  return requestJson('/api/v1/dictionaries/work-types')
}

export async function getAuthorRoles() {
  return requestJson('/api/v1/dictionaries/author-roles')
}

export async function getConsentRejectReasons() {
  return requestJson('/api/v1/dictionaries/consent-reject-reasons')
}

