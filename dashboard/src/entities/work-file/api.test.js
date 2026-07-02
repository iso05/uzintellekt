import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const requestJson = vi.fn()
vi.mock('@shared/api', () => ({ requestJson: (...args) => requestJson(...args) }))

import {
  listWorkFiles,
  initUpload,
  confirmUpload,
  getDownloadUrl,
  deleteWorkFile,
  getStorageQuota,
  putToStorage,
} from './api'

describe('work-file api — control-plane calls', () => {
  beforeEach(() => requestJson.mockReset())

  it('listWorkFiles GETs the files path and returns an array as-is', async () => {
    requestJson.mockResolvedValue([{ fileId: 'a' }])
    const out = await listWorkFiles('w1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files')
    expect(out).toEqual([{ fileId: 'a' }])
  })

  it('listWorkFiles unwraps an items/content-wrapped response', async () => {
    requestJson.mockResolvedValueOnce({ items: [{ fileId: 'b' }] })
    expect(await listWorkFiles('w1')).toEqual([{ fileId: 'b' }])
    requestJson.mockResolvedValueOnce({ content: [{ fileId: 'c' }] })
    expect(await listWorkFiles('w1')).toEqual([{ fileId: 'c' }])
  })

  it('listWorkFiles falls back to [] for an unexpected shape', async () => {
    requestJson.mockResolvedValue({ foo: 'bar' })
    expect(await listWorkFiles('w1')).toEqual([])
  })

  it('initUpload POSTs filename + sizeBytes to /init', async () => {
    requestJson.mockResolvedValue({ fileId: 'f1', uploadUrl: 'https://s3/x' })
    await initUpload('w1', { filename: 'a.pdf', sizeBytes: 123 })
    const [path, opts] = requestJson.mock.calls[0]
    expect(path).toBe('/api/v1/works/w1/files/init')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ filename: 'a.pdf', sizeBytes: 123 })
  })

  it('confirmUpload POSTs to /confirm', async () => {
    requestJson.mockResolvedValue({ status: 'UPLOADED' })
    await confirmUpload('w1', 'f1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1/confirm', {
      method: 'POST',
    })
  })

  it('getDownloadUrl GETs the download-url path', async () => {
    requestJson.mockResolvedValue({ downloadUrl: 'https://s3/d' })
    await getDownloadUrl('w1', 'f1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1/download-url')
  })

  it('deleteWorkFile DELETEs the file path', async () => {
    requestJson.mockResolvedValue(null)
    await deleteWorkFile('w1', 'f1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1', {
      method: 'DELETE',
    })
  })

  it('getStorageQuota GETs /me/storage-quota', async () => {
    requestJson.mockResolvedValue({ usedBytes: 1, limitBytes: 2, remainingBytes: 1 })
    await getStorageQuota()
    expect(requestJson).toHaveBeenCalledWith('/api/v1/me/storage-quota')
  })
})

// ── putToStorage: must bypass the shared HTTP layer entirely ────────────────
class MockXHR {
  constructor() {
    this.upload = {}
    this.headers = {}
    this.status = 0
    this.method = null
    this.url = null
  }
  open(method, url) {
    this.method = method
    this.url = url
  }
  setRequestHeader(k, v) {
    this.headers[k] = v
  }
  send() {
    MockXHR.instances.push(this)
  }
}
MockXHR.instances = []

describe('putToStorage — raw PUT straight to storage', () => {
  beforeEach(() => {
    requestJson.mockReset()
    MockXHR.instances = []
    vi.stubGlobal('XMLHttpRequest', MockXHR)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('PUTs to the absolute uploadUrl with the required Content-Type and no Authorization', async () => {
    const file = new Blob(['hi'])
    const p = putToStorage('https://storage.example/presigned?sig=abc', file, 'application/pdf')
    const xhr = MockXHR.instances[0]

    expect(xhr.method).toBe('PUT')
    expect(xhr.url).toBe('https://storage.example/presigned?sig=abc')
    expect(xhr.headers['Content-Type']).toBe('application/pdf')
    // The presigned signature IS the auth — never attach a bearer token.
    expect(xhr.headers['Authorization']).toBeUndefined()
    // It must not route through the API base URL.
    expect(requestJson).not.toHaveBeenCalled()

    xhr.status = 200
    xhr.onload()
    await expect(p).resolves.toBeUndefined()
  })

  it('reports progress as an integer percent', async () => {
    const onProgress = vi.fn()
    const p = putToStorage('https://storage/x', new Blob(['x']), 'text/plain', onProgress)
    const xhr = MockXHR.instances[0]
    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 200 })
    expect(onProgress).toHaveBeenCalledWith(25)
    xhr.status = 204
    xhr.onload()
    await p
  })

  it('rejects with .status on a non-2xx response', async () => {
    const p = putToStorage('https://storage/x', new Blob(['x']), 'text/plain')
    const xhr = MockXHR.instances[0]
    xhr.status = 403
    xhr.onload()
    await expect(p).rejects.toMatchObject({ status: 403 })
  })

  it('rejects with status 0 on a network error', async () => {
    const p = putToStorage('https://storage/x', new Blob(['x']), 'text/plain')
    const xhr = MockXHR.instances[0]
    xhr.onerror()
    await expect(p).rejects.toMatchObject({ status: 0 })
  })
})
