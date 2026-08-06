import { requestJson } from '@shared/api'

// Frontend API for the work-files presigned upload flow + storage quota.
// Control-plane calls (init/confirm/list/delete/url/quota) go through the shared
// HTTP layer (Bearer + refresh). The actual bytes go straight to object storage
// via putToStorage — deliberately bypassing request()/API_BASE_URL/auth, because
// the presigned URL is already authorized and signed for an exact content type.

function base(workId) {
  if (!workId || workId === 'null' || workId === 'undefined') {
    throw new Error("Asar ID mavjud emas (Work ID is required)")
  }
  return `/api/v1/works/${workId}/files`
}

// GET …/files — list a work's files. The endpoint shape can be a bare array or a
// wrapped object; normalize to an array so callers never have to unwrap.
export async function listWorkFiles(workId) {
  const data = await requestJson(base(workId))
  if (Array.isArray(data)) return data
  return data?.items ?? data?.content ?? data?.data?.items ?? []
}

// POST …/files/init — reserve an upload slot. Server derives the content type
// from `filename` and returns it as `requiredContentType`; the PUT must echo it.
export async function initUpload(workId, { filename, sizeBytes }) {
  return requestJson(`${base(workId)}/init`, {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes }),
  })
}

// POST …/files/{fileId}/confirm — finalize after the bytes have landed.
export async function confirmUpload(workId, fileId) {
  return requestJson(`${base(workId)}/${fileId}/confirm`, { method: 'POST' })
}

// GET …/files/{fileId}/download-url — short-lived presigned download link.
export async function getDownloadUrl(workId, fileId) {
  return requestJson(`${base(workId)}/${fileId}/download-url`)
}

// DELETE …/files/{fileId}
export async function deleteWorkFile(workId, fileId) {
  return requestJson(`${base(workId)}/${fileId}`, { method: 'DELETE' })
}

// GET /me/storage-quota — current user's used/limit/remaining bytes.
export async function getStorageQuota() {
  return requestJson('/api/v1/me/storage-quota')
}

/**
 * PUT the file bytes directly to the presigned storage URL.
 *
 * Uses XMLHttpRequest (not fetch) because we need upload progress, which fetch
 * cannot report. Intentionally sends NO Authorization header and targets the
 * absolute `uploadUrl` — the signature is the authorization. The Content-Type
 * MUST equal the `requiredContentType` returned by init, or storage rejects it.
 *
 * @returns {Promise<void>} resolves on 2xx; rejects with an Error carrying
 *   `.status` (HTTP status, or 0 for network/timeout).
 */
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
