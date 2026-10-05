import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requestJson, putToStorage } = vi.hoisted(() => ({
  requestJson: vi.fn(),
  putToStorage: vi.fn(),
}))

vi.mock('@shared/api', () => ({ requestJson }))
vi.mock('@/entities/work-file', () => ({ putToStorage }))

import {
  getRightHolderDocuments,
  getRightHolderDocumentDownloadUrl,
  uploadRightHolderDocument,
} from './api'

describe('right-holder document API', () => {
  beforeEach(() => {
    requestJson.mockReset()
    putToStorage.mockReset()
  })

  it('normalizes a wrapped document list', async () => {
    requestJson.mockResolvedValue({ items: [{ documentId: 'd1' }] })

    await expect(getRightHolderDocuments('w1', 'h1')).resolves.toEqual([{ documentId: 'd1' }])
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/right-holders/h1/documents')
  })

  it('gets a download URL for an owner-visible supporting document', async () => {
    requestJson.mockResolvedValue({ downloadUrl: 'https://storage.example/document' })

    await expect(getRightHolderDocumentDownloadUrl('w1', 'h1', 'd1')).resolves.toEqual({
      downloadUrl: 'https://storage.example/document',
    })
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/right-holders/h1/documents/d1/download-url')
  })

  it('runs init → presigned PUT → confirm with the server content type', async () => {
    requestJson
      .mockResolvedValueOnce({
        documentId: 'd1',
        uploadUrl: 'https://storage.example/upload?signature=1',
        requiredContentType: 'application/pdf',
      })
      .mockResolvedValueOnce({ documentId: 'd1', status: 'UPLOADED' })
    putToStorage.mockResolvedValue(undefined)
    const states = []
    const file = new File(['document'], 'proof.pdf', { type: 'application/pdf' })

    await expect(
      uploadRightHolderDocument({
        workId: 'w1',
        rightHolderId: 'h1',
        file,
        onState: (state) => states.push(state),
      })
    ).resolves.toEqual({ documentId: 'd1', status: 'UPLOADED' })

    expect(requestJson).toHaveBeenNthCalledWith(1, '/api/v1/works/w1/right-holders/h1/documents/init', {
      method: 'POST',
      body: JSON.stringify({ filename: 'proof.pdf', sizeBytes: file.size }),
    })
    expect(putToStorage).toHaveBeenCalledWith(
      'https://storage.example/upload?signature=1',
      file,
      'application/pdf',
      undefined
    )
    expect(requestJson).toHaveBeenNthCalledWith(2, '/api/v1/works/w1/right-holders/h1/documents/d1/confirm', {
      method: 'POST',
    })
    expect(states).toEqual(['init', 'put', 'confirm', 'done'])
  })

  it('fails safely when init omits presigned-upload fields', async () => {
    requestJson.mockResolvedValue({ documentId: 'd1' })
    const file = new File(['document'], 'proof.pdf', { type: 'application/pdf' })

    await expect(uploadRightHolderDocument({ workId: 'w1', rightHolderId: 'h1', file }))
      .rejects.toThrow('initialization response is incomplete')
    expect(putToStorage).not.toHaveBeenCalled()
  })
})
