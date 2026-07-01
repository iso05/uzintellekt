import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { downloadBlob } from '@/shared/lib/download'

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not revoke the object URL synchronously (would cancel the download)', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    downloadBlob(blob, 'file.pdf')

    // Revoking before the browser starts the download aborts it in some browsers.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('revokes the object URL after a deferred tick', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    downloadBlob(blob, 'file.pdf')

    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
