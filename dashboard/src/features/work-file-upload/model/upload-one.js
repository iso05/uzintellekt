import {
  initUpload as defaultInit,
  putToStorage as defaultPut,
  confirmUpload as defaultConfirm,
} from '@/entities/work-file'

// Lifecycle of a single upload, surfaced to the UI per queue item.
export const UPLOAD_STATE = {
  QUEUED: 'queued',
  INIT: 'init',
  PUT: 'put',
  CONFIRM: 'confirm',
  DONE: 'done',
  ERROR: 'error',
}

// Running = occupies a concurrency slot.
export const RUNNING_STATES = new Set([
  UPLOAD_STATE.INIT,
  UPLOAD_STATE.PUT,
  UPLOAD_STATE.CONFIRM,
])

const DEFAULT_MAX_ATTEMPTS = 3

// Exponential backoff capped at 8s: 500ms, 1s, 2s, …
export function defaultBackoff(attempt) {
  return Math.min(8000, 500 * 2 ** (attempt - 1))
}

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Decide whether a failure is worth retrying.
 * - network / timeout (status 0 or missing) → retry
 * - 403/410 → presigned URL expired or revoked → retry (a fresh init re-signs it)
 * - 408 / 5xx → transient → retry
 * - 429 (rate limit) → do NOT loop-retry; surface "too many requests" so the
 *   user backs off (backend sends Retry-After; hammering it makes it worse)
 * - 400 / 404 / 422 etc. → client error, retrying won't help → give up
 */
export function isRetriable(err) {
  const s = err?.status
  if (s === undefined || s === null) return true
  if (s === 0) return true
  if (s === 403 || s === 410) return true
  if (s === 408) return true
  if (s === 429) return false
  if (s >= 500) return true
  return false
}

/**
 * Drive one file through init → PUT → confirm, retrying transient/expired-URL
 * failures with backoff. Each retry re-runs init, so an expired presigned
 * uploadUrl is transparently re-issued.
 *
 * Dependencies (api/sleep/backoff) are injected so this is unit-testable with
 * no network and no real timers.
 *
 * @returns {Promise<object>} the confirmed WorkFileResponse
 * @throws the last error once attempts are exhausted or the error is fatal
 */
export async function uploadOne({
  workId,
  file,
  api = { initUpload: defaultInit, putToStorage: defaultPut, confirmUpload: defaultConfirm },
  onProgress,
  onState,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  backoff = defaultBackoff,
  sleep = _sleep,
}) {
  let attempt = 0
  for (;;) {
    attempt++
    try {
      onState?.(UPLOAD_STATE.INIT)
      const init = await api.initUpload(workId, {
        filename: file.name,
        sizeBytes: file.size,
      })

      onState?.(UPLOAD_STATE.PUT)
      await api.putToStorage(init.uploadUrl, file, init.requiredContentType, onProgress)

      onState?.(UPLOAD_STATE.CONFIRM)
      const confirmed = await api.confirmUpload(workId, init.fileId)

      onState?.(UPLOAD_STATE.DONE)
      return confirmed
    } catch (err) {
      if (attempt >= maxAttempts || !isRetriable(err)) {
        onState?.(UPLOAD_STATE.ERROR)
        throw err
      }
      await sleep(backoff(attempt))
      // loop → fresh init re-signs an expired uploadUrl
    }
  }
}
