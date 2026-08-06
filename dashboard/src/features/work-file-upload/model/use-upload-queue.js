import { useCallback, useEffect, useRef, useState } from 'react'
import {
  initUpload as defaultInit,
  putToStorage as defaultPut,
  confirmUpload as defaultConfirm,
  isAllowedFile,
  fitsInQuota,
} from '@/entities/work-file'
import { uploadOne, UPLOAD_STATE, RUNNING_STATES } from './upload-one'

// Bytes still "in flight" against the quota: only not-yet-confirmed items
// (queued/running). DONE files are already counted by the server's refreshed
// remainingBytes, and ERROR files never landed — counting either here would
// double-charge the quota and cause false "not enough space" rejections.
function committedBytes(items) {
  return items
    .filter((i) => i.state !== UPLOAD_STATE.DONE && i.state !== UPLOAD_STATE.ERROR)
    .reduce((sum, i) => sum + (i.size || 0), 0)
}

let _seq = 0
function nextLocalId() {
  _seq += 1
  return `u${_seq}_${Date.now()}`
}

/**
 * Headless upload queue: validates added files (whitelist + quota), uploads up
 * to `maxParallel` at a time via uploadOne, and exposes per-item progress/state.
 *
 * @param {string} workId
 * @param {object} opts
 *   - remainingBytes: bytes still free in the user's quota (server snapshot)
 *   - maxParallel: max concurrent uploads (default 3)
 *   - api: injectable { initUpload, putToStorage, confirmUpload } for tests
 *   - uploader: injectable uploadOne for tests
 *   - onFileDone: (confirmedFile) => void, called after each confirm
 *
 * @returns {{ items, addFiles, retry, remove, clearFinished, activeCount }}
 *   addFiles(fileList) → { accepted: number, rejected: [{ name, reason }] }
 *   reason ∈ 'type' | 'quota'
 */
export function useUploadQueue(
  workId,
  {
    ensureWorkId,
    remainingBytes = Infinity,
    maxParallel = 3,
    api = { initUpload: defaultInit, putToStorage: defaultPut, confirmUpload: defaultConfirm },
    uploader = uploadOne,
    onFileDone,
  } = {}
) {
  const [items, setItems] = useState([])
  const startedRef = useRef(new Set())
  // Mirror of `items` for synchronous reads in addFiles (quota pre-check),
  // so addFiles can return its accepted/rejected result without waiting for a render.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const patch = useCallback((localId, changes) => {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, ...changes } : i)))
  }, [])

  const runItem = useCallback(
    async (item) => {
      try {
        let targetWorkId = workId
        const isInvalid = (id) => !id || id === 'test-work-id' || id === 'null' || id === 'undefined'
        if (isInvalid(targetWorkId) && ensureWorkId) {
          targetWorkId = await ensureWorkId()
        }
        if (isInvalid(targetWorkId)) {
          throw new Error("Asar ID mavjud emas")
        }

        const confirmed = await uploader({
          workId: targetWorkId,
          file: item.file,
          api,
          onProgress: (p) => patch(item.localId, { progress: p }),
          onState: (s) => patch(item.localId, { state: s }),
        })
        patch(item.localId, { state: UPLOAD_STATE.DONE, progress: 100, error: undefined })
        onFileDone?.(confirmed)
      } catch (err) {
        patch(item.localId, {
          state: UPLOAD_STATE.ERROR,
          error: err?.message,
          errorCode: err?.apiError?.errorCode ?? null,
          errorStatus: err?.status ?? null,
        })
      }
    },
    [workId, ensureWorkId, api, uploader, patch, onFileDone]
  )

  // Pump: keep up to maxParallel uploads running. A ref guards against starting
  // the same item twice across the re-renders each state change triggers.
  useEffect(() => {
    const active = items.filter((i) => RUNNING_STATES.has(i.state)).length
    let slots = maxParallel - active
    if (slots <= 0) return
    for (const it of items) {
      if (slots <= 0) break
      if (it.state === UPLOAD_STATE.QUEUED && !startedRef.current.has(it.localId)) {
        startedRef.current.add(it.localId)
        slots -= 1
        runItem(it)
      }
    }
  }, [items, maxParallel, runItem])

  const addFiles = useCallback(
    (files) => {
      const incoming = Array.from(files || [])
      const accepted = []
      const rejected = []
      const additions = []
      let pending = committedBytes(itemsRef.current)

      for (const file of incoming) {
        if (!isAllowedFile(file)) {
          rejected.push({ name: file.name, reason: 'type' })
          continue
        }
        if (!fitsInQuota(file.size, remainingBytes, pending)) {
          rejected.push({ name: file.name, reason: 'quota' })
          continue
        }
        pending += file.size
        additions.push({
          localId: nextLocalId(),
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          state: UPLOAD_STATE.QUEUED,
          error: undefined,
          attempts: 0,
        })
        accepted.push(file.name)
      }

      if (additions.length) setItems((prev) => [...prev, ...additions])
      return { accepted: accepted.length, rejected }
    },
    [remainingBytes]
  )

  const retry = useCallback(
    (localId) => {
      startedRef.current.delete(localId)
      setItems((prev) =>
        prev.map((i) =>
          i.localId === localId
            ? { ...i, state: UPLOAD_STATE.QUEUED, error: undefined, progress: 0, attempts: i.attempts + 1 }
            : i
        )
      )
    },
    []
  )

  const remove = useCallback((localId) => {
    startedRef.current.delete(localId)
    setItems((prev) => prev.filter((i) => i.localId !== localId))
  }, [])

  const clearFinished = useCallback(() => {
    setItems((prev) => {
      const survivors = prev.filter((i) => i.state !== UPLOAD_STATE.DONE)
      prev
        .filter((i) => i.state === UPLOAD_STATE.DONE)
        .forEach((i) => startedRef.current.delete(i.localId))
      return survivors
    })
  }, [])

  const activeCount = items.filter((i) => RUNNING_STATES.has(i.state)).length

  return { items, addFiles, retry, remove, clearFinished, activeCount }
}
