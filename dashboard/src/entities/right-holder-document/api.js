import { requestJson, request } from '@shared/api'

export async function getRightHolderDocuments(workId, rightHolderId) {
  if (!workId || !rightHolderId) return []
  return requestJson(`/api/v1/works/${workId}/right-holders/${rightHolderId}/documents`)
}

export async function initRightHolderDocument(workId, rightHolderId, { filename, sizeBytes }) {
  return requestJson(`/api/v1/works/${workId}/right-holders/${rightHolderId}/documents/init`, {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes }),
  })
}

export async function confirmRightHolderDocument(workId, rightHolderId, documentId) {
  return requestJson(`/api/v1/works/${workId}/right-holders/${rightHolderId}/documents/${documentId}/confirm`, {
    method: 'POST',
  })
}

export async function deleteRightHolderDocument(workId, rightHolderId, documentId) {
  return requestJson(`/api/v1/works/${workId}/right-holders/${rightHolderId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export async function uploadRightHolderDocument({ workId, rightHolderId, file, onProgress, onState }) {
  onState?.('init')
  const initRes = await initRightHolderDocument(workId, rightHolderId, {
    filename: file.name,
    sizeBytes: file.size,
  })

  const documentId = initRes?.documentId
  const uploadUrl = initRes?.uploadUrl
  const requiredContentType = initRes?.requiredContentType || file.type || 'application/octet-stream'

  onState?.('put')
  
  // Direct PUT to S3 / storage endpoint
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', requiredContentType)

    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          onProgress?.(pct)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })

  onState?.('confirm')
  await confirmRightHolderDocument(workId, rightHolderId, documentId)
  onState?.('done')

  return { documentId, filename: file.name }
}
