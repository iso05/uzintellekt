import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'

const WORKS_GRID = '/api/v1/works/grid'
const FILES_GRID = '/api/v1/admin/work-files/grid'

export function getWorksGrid({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true },
} = {}) {
  return cachedGridGet(WORKS_GRID, { page, size, filters, sort })
}

// Single work fetched through the grid (there is no dedicated GET /works/{id}).
export async function getWorkById(workId) {
  const data = await cachedGridGet(WORKS_GRID, {
    page: 1,
    size: 1,
    filters: [{ field: 'id', operator: 'eq', value: workId }],
  })
  const items = data?.items ?? []
  return items[0] ?? null
}

// Admin moderation decision. decision: 'APPROVE' | 'REJECT'. Invalidates the
// works grid so the queue and the detail view both reflect the new state.
export async function decideWork(workId, { decision, reason } = {}) {
  const data = await requestJson(`/api/v1/admin/works/${workId}/decide`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, reason }),
  })
  invalidateCache(WORKS_GRID)
  return data
}

// Create a work on behalf of a user (admin). Returns WorkResponse.
export async function createWorkForUser(userId, payload) {
  const data = await requestJson(`/api/v1/admin/users/${userId}/works`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  invalidateCache(WORKS_GRID)
  return data
}

export async function updateWork(workId, payload) {
  const data = await requestJson(`/api/v1/admin/works/${workId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  invalidateCache(WORKS_GRID)
  return data
}

export async function submitWork(workId) {
  await requestJson(`/api/v1/admin/works/${workId}/submit`, { method: 'POST' })
  invalidateCache(WORKS_GRID)
}

export function getAdminWorkFiles(workId) {
  return requestJson(`/api/v1/admin/works/${workId}/files`)
}

export function getRightHolderDocuments(workId, rightHolderId) {
  return requestJson(`/api/v1/admin/works/${workId}/right-holders/${rightHolderId}/documents`)
}

export function getAdminRightHolderDocumentDownloadUrl(workId, rightHolderId, documentId) {
  return requestJson(
    `/api/v1/admin/works/${workId}/right-holders/${rightHolderId}/documents/${documentId}/download-url`
  )
}

export function getAdminFileDownloadUrl(workId, fileId) {
  return requestJson(`/api/v1/admin/works/${workId}/files/${fileId}/download-url`)
}

// Global grid of every work-file attachment (admin).
export function getAdminFilesGrid({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true },
} = {}) {
  return cachedGridGet(FILES_GRID, { page, size, filters, sort })
}

export async function deleteWorkFile(workId, fileId) {
  await requestJson(`/api/v1/admin/works/${workId}/files/${fileId}`, { method: 'DELETE' })
  invalidateCache(FILES_GRID)
}

export function initAdminUpload(workId, { filename, sizeBytes }) {
  return requestJson(`/api/v1/works/${workId}/files/init`, {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes }),
  })
}

export function confirmAdminUpload(workId, fileId) {
  return requestJson(`/api/v1/works/${workId}/files/${fileId}/confirm`, {
    method: 'POST',
  })
}

export function putToStorage(uploadUrl, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    if (contentType) xhr.setRequestHeader('Content-Type', contentType)

    if (typeof onProgress === 'function' && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        const err = new Error(`Upload failed: ${xhr.status}`)
        err.status = xhr.status
        reject(err)
      }
    }
    xhr.onerror = () => {
      const err = new Error('Network error during upload')
      err.status = 0
      reject(err)
    }
    xhr.ontimeout = () => {
      const err = new Error('Upload timed out')
      err.status = 0
      reject(err)
    }

    xhr.send(file)
  })
}
