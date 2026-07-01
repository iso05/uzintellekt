import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUploadQueue } from './use-upload-queue'
import { UPLOAD_STATE } from './upload-one'

const f = (name, size = 10) => ({ name, size })

// A controllable uploader: marks the item running immediately (occupies a slot)
// and hands back a deferred so the test decides when each upload finishes.
function makeControlledUploader() {
  const calls = []
  const uploader = ({ file, onState, onProgress }) => {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    onState?.(UPLOAD_STATE.PUT)
    calls.push({ file, onState, onProgress, resolve, reject })
    return promise
  }
  return { uploader, calls }
}

describe('useUploadQueue — validation on addFiles', () => {
  it('rejects non-whitelisted types and accepts allowed ones', () => {
    const { uploader } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: Infinity, uploader })
    )

    let res
    act(() => {
      res = result.current.addFiles([f('ok.pdf'), f('bad.exe')])
    })

    expect(res.accepted).toBe(1)
    expect(res.rejected).toEqual([{ name: 'bad.exe', reason: 'type' }])
  })

  it('rejects files that exceed the remaining quota, counting queued bytes', () => {
    const { uploader } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: 100, maxParallel: 0, uploader })
    )

    let res
    act(() => {
      // first 80 fits; second 30 would push committed to 110 > 100 → rejected
      res = result.current.addFiles([f('a.pdf', 80), f('b.pdf', 30)])
    })

    expect(res.accepted).toBe(1)
    expect(res.rejected).toEqual([{ name: 'b.pdf', reason: 'quota' }])
  })
})

describe('useUploadQueue — upload lifecycle', () => {
  it('runs an upload to DONE and calls onFileDone', async () => {
    const { uploader, calls } = makeControlledUploader()
    const onFileDone = vi.fn()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: Infinity, uploader, onFileDone })
    )

    act(() => {
      result.current.addFiles([f('a.pdf')])
    })

    await waitFor(() => expect(calls.length).toBe(1))
    await act(async () => {
      calls[0].resolve({ fileId: 'f1', status: 'UPLOADED' })
    })

    await waitFor(() => expect(result.current.items[0].state).toBe(UPLOAD_STATE.DONE))
    expect(result.current.items[0].progress).toBe(100)
    expect(onFileDone).toHaveBeenCalledWith({ fileId: 'f1', status: 'UPLOADED' })
  })
})

describe('useUploadQueue — concurrency', () => {
  it('never runs more than maxParallel uploads at once', async () => {
    const { uploader, calls } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: Infinity, maxParallel: 2, uploader })
    )

    act(() => {
      result.current.addFiles([f('a.pdf'), f('b.pdf'), f('c.pdf')])
    })

    // Only 2 of 3 start.
    await waitFor(() => expect(calls.length).toBe(2))
    expect(result.current.activeCount).toBe(2)

    // Finish one → the third starts.
    await act(async () => {
      calls[0].resolve({ fileId: 'f1', status: 'UPLOADED' })
    })
    await waitFor(() => expect(calls.length).toBe(3))
  })
})

describe('useUploadQueue — quota accounting', () => {
  it('does not double-count a DONE file against the quota', async () => {
    const { uploader, calls } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: 100, uploader })
    )

    act(() => {
      result.current.addFiles([f('a.pdf', 60)])
    })
    await waitFor(() => expect(calls.length).toBe(1))
    await act(async () => {
      calls[0].resolve({ fileId: '1', status: 'UPLOADED' })
    })
    await waitFor(() => expect(result.current.items[0].state).toBe(UPLOAD_STATE.DONE))

    // A is DONE — its 60 bytes are on the server now (reflected in remainingBytes),
    // so they must not be counted again here. B (60) still fits in remaining 100.
    let res
    act(() => {
      res = result.current.addFiles([f('b.pdf', 60)])
    })
    expect(res.accepted).toBe(1)
    expect(res.rejected).toEqual([])
  })
})

describe('useUploadQueue — retry & remove', () => {
  it('retry re-queues a failed item and runs it again', async () => {
    const { uploader, calls } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: Infinity, uploader })
    )

    act(() => {
      result.current.addFiles([f('a.pdf')])
    })
    await waitFor(() => expect(calls.length).toBe(1))

    await act(async () => {
      calls[0].reject(Object.assign(new Error('boom'), { status: 503 }))
    })
    await waitFor(() => expect(result.current.items[0].state).toBe(UPLOAD_STATE.ERROR))

    const id = result.current.items[0].localId
    act(() => {
      result.current.retry(id)
    })

    await waitFor(() => expect(calls.length).toBe(2))
    expect(result.current.items[0].attempts).toBe(1)
  })

  it('remove drops an item from the queue', async () => {
    const { uploader, calls } = makeControlledUploader()
    const { result } = renderHook(() =>
      useUploadQueue('w1', { remainingBytes: Infinity, uploader })
    )

    act(() => {
      result.current.addFiles([f('a.pdf')])
    })
    await waitFor(() => expect(calls.length).toBe(1))
    const id = result.current.items[0].localId

    act(() => {
      result.current.remove(id)
    })
    expect(result.current.items).toHaveLength(0)
  })
})
