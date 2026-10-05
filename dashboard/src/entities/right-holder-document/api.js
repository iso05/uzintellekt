import { requestJson } from '@shared/api'
import { putToStorage } from '@/entities/work-file'

export async function getRightHolderDocuments(workId, rightHolderId) {
  if (!workId || !rightHolderId) return []
  const data = await requestJson(`/api/v1/works/${workId}/right-holders/${rightHolderId}/documents`)
  if (Array.isArray(data)) return data
  return data?.items ?? data?.content ?? data?.data?.items ?? []
}

// Owner-only, short-lived presigned link for a supporting document. Available
// in every work state after the API update.
export function getRightHolderDocumentDownloadUrl(workId, rightHolderId, documentId) {
  return requestJson(
    `/api/v1/works/${workId}/right-holders/${rightHolderId}/documents/${documentId}/download-url`
  )
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
  console.group(`📄 uploadRightHolderDocument: "${file.name}"`)
  console.log('workId:', workId)
  console.log('rightHolderId:', rightHolderId)
  console.log('file.size:', file.size, 'bytes')

  try {
    onState?.('init')
    console.log(`🔄 POST /works/${workId}/right-holders/${rightHolderId}/documents/init`, {
      filename: file.name,
      sizeBytes: file.size,
    })
    const initRes = await initRightHolderDocument(workId, rightHolderId, {
      filename: file.name,
      sizeBytes: file.size,
    })
    console.log('✅ init response:', initRes)

    const documentId = initRes?.documentId || initRes?.fileId || initRes?.id
    const uploadUrl = initRes?.uploadUrl
    const requiredContentType = initRes?.requiredContentType
    if (!documentId || !uploadUrl || !requiredContentType) {
      const err = new Error('Server document-upload initialization response is incomplete')
      err.status = 0
      throw err
    }

    onState?.('put')
    console.log(`🔄 PUT to S3: ${uploadUrl}`)
    console.log('requiredContentType:', requiredContentType)
    await putToStorage(uploadUrl, file, requiredContentType, onProgress)
    console.log('✅ S3 PUT muvaffaqiyatli')

    onState?.('confirm')
    console.log(`🔄 POST /works/${workId}/right-holders/${rightHolderId}/documents/${documentId}/confirm`)
    const confirmed = await confirmRightHolderDocument(workId, rightHolderId, documentId)
    console.log('✅ confirm response:', confirmed)

    onState?.('done')
    console.groupEnd()
    return confirmed || { documentId, filename: file.name }
  } catch (err) {
    console.error('❌ uploadRightHolderDocument Xatosi:', {
      message: err?.message,
      status: err?.status,
      errorCode: err?.apiError?.errorCode,
      errorMessage: err?.apiError?.errorMessage,
      fullError: err,
    })
    console.groupEnd()
    throw err
  }
}
