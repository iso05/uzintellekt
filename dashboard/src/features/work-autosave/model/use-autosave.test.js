import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutosave } from './use-autosave'

function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('useAutosave', () => {
  it('skips the first render (loaded/restored data is not an edit)', async () => {
    const persist = vi.fn().mockResolvedValue()
    renderHook(() =>
      useAutosave({ data: { v: 0 }, storageKey: 'k', canPersist: true, persist, delay: 5 })
    )
    await new Promise((r) => setTimeout(r, 30))
    expect(persist).not.toHaveBeenCalled()
  })

  it('does not sync to the server while the form is invalid', async () => {
    const persist = vi.fn().mockResolvedValue()
    const { rerender } = renderHook((p) => useAutosave(p), {
      initialProps: { data: { v: 0 }, storageKey: 'k', canPersist: false, persist, delay: 5 },
    })
    rerender({ data: { v: 1 }, storageKey: 'k', canPersist: false, persist, delay: 5 })
    await new Promise((r) => setTimeout(r, 30))
    expect(persist).not.toHaveBeenCalled()
  })

  it('re-fires a trailing save for edits made during an in-flight persist', async () => {
    const seen = []
    const d1 = deferred()
    const persist = vi.fn((data) => {
      seen.push(data)
      return seen.length === 1 ? d1.promise : Promise.resolve()
    })
    const { rerender } = renderHook((p) => useAutosave(p), {
      initialProps: { data: { v: 0 }, storageKey: 'k', canPersist: true, persist, delay: 5 },
    })

    rerender({ data: { v: 1 }, storageKey: 'k', canPersist: true, persist, delay: 5 })
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(1)) // in-flight (d1 pending)

    // Edit again while the first save is still running — must not be dropped.
    rerender({ data: { v: 2 }, storageKey: 'k', canPersist: true, persist, delay: 5 })
    await new Promise((r) => setTimeout(r, 20))
    expect(persist).toHaveBeenCalledTimes(1) // still one; second is deferred

    await act(async () => {
      d1.resolve()
    })
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(2))
    expect(seen[1]).toEqual({ v: 2 }) // trailing save carries the latest edit
  })
})
