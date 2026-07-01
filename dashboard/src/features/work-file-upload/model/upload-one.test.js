import { describe, it, expect, vi } from 'vitest'

// Pure orchestrator — no network, no React. Inject api + a synchronous sleep.
import { uploadOne, isRetriable, UPLOAD_STATE } from './upload-one'

const file = { name: 'a.pdf', size: 100 }
const noSleep = () => Promise.resolve()

function makeApi(overrides = {}) {
  return {
    initUpload: vi.fn().mockResolvedValue({
      fileId: 'f1',
      uploadUrl: 'https://storage/x?sig=1',
      requiredContentType: 'application/pdf',
    }),
    putToStorage: vi.fn().mockResolvedValue(undefined),
    confirmUpload: vi.fn().mockResolvedValue({ fileId: 'f1', status: 'UPLOADED' }),
    ...overrides,
  }
}

describe('isRetriable', () => {
  it('retries network/timeout and expired-presigned and transient', () => {
    expect(isRetriable({ status: 0 })).toBe(true)
    expect(isRetriable({})).toBe(true)
    expect(isRetriable({ status: 403 })).toBe(true)
    expect(isRetriable({ status: 410 })).toBe(true)
    expect(isRetriable({ status: 503 })).toBe(true)
  })
  it('does not retry rate-limit (429) — surfaced, not looped', () => {
    expect(isRetriable({ status: 429 })).toBe(false)
  })
  it('does not retry client errors', () => {
    expect(isRetriable({ status: 400 })).toBe(false)
    expect(isRetriable({ status: 404 })).toBe(false)
    expect(isRetriable({ status: 422 })).toBe(false)
  })
})

describe('uploadOne — happy path', () => {
  it('runs init → put → confirm and reports the state sequence', async () => {
    const api = makeApi()
    const states = []
    const result = await uploadOne({
      workId: 'w1',
      file,
      api,
      onState: (s) => states.push(s),
      sleep: noSleep,
    })

    expect(api.initUpload).toHaveBeenCalledWith('w1', { filename: 'a.pdf', sizeBytes: 100 })
    expect(api.putToStorage).toHaveBeenCalledWith(
      'https://storage/x?sig=1',
      file,
      'application/pdf',
      undefined
    )
    expect(api.confirmUpload).toHaveBeenCalledWith('w1', 'f1')
    expect(result).toEqual({ fileId: 'f1', status: 'UPLOADED' })
    expect(states).toEqual([
      UPLOAD_STATE.INIT,
      UPLOAD_STATE.PUT,
      UPLOAD_STATE.CONFIRM,
      UPLOAD_STATE.DONE,
    ])
  })
})

describe('uploadOne — expired presigned URL', () => {
  it('re-inits and retries when PUT fails with 403, then succeeds', async () => {
    const expired = Object.assign(new Error('expired'), { status: 403 })
    const api = makeApi({
      putToStorage: vi.fn().mockRejectedValueOnce(expired).mockResolvedValueOnce(undefined),
    })
    const sleep = vi.fn().mockResolvedValue(undefined)

    const result = await uploadOne({ workId: 'w1', file, api, sleep })

    // init ran twice (the retry re-signs the URL); put ran twice; confirm once.
    expect(api.initUpload).toHaveBeenCalledTimes(2)
    expect(api.putToStorage).toHaveBeenCalledTimes(2)
    expect(api.confirmUpload).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('UPLOADED')
  })
})

describe('uploadOne — gives up', () => {
  it('throws and emits ERROR after exhausting attempts on transient failures', async () => {
    const boom = Object.assign(new Error('down'), { status: 503 })
    const api = makeApi({ putToStorage: vi.fn().mockRejectedValue(boom) })
    const states = []

    await expect(
      uploadOne({ workId: 'w1', file, api, maxAttempts: 3, sleep: noSleep, onState: (s) => states.push(s) })
    ).rejects.toBe(boom)

    expect(api.putToStorage).toHaveBeenCalledTimes(3)
    expect(states.at(-1)).toBe(UPLOAD_STATE.ERROR)
  })

  it('does not retry a fatal client error (422)', async () => {
    const invalid = Object.assign(new Error('bad'), { status: 422 })
    const api = makeApi({ initUpload: vi.fn().mockRejectedValue(invalid) })

    await expect(uploadOne({ workId: 'w1', file, api, sleep: noSleep })).rejects.toBe(invalid)
    expect(api.initUpload).toHaveBeenCalledTimes(1)
    expect(api.putToStorage).not.toHaveBeenCalled()
  })
})
