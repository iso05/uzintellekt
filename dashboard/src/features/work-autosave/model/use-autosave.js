import { useCallback, useEffect, useRef, useState } from 'react'
import { saveDraft } from '@/shared/lib/draft-storage'

export const AUTOSAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED_LOCAL: 'saved_local', // written to localStorage only (form not yet valid for server)
  SAVED: 'saved', // synced to backend
  ERROR: 'error',
}

/**
 * Debounced auto-save. Every change is written to localStorage (always); when
 * `canPersist` is true the change is also pushed to the backend via `persist`.
 *
 * Guarantees:
 * - The first render is skipped so loading/restoring data isn't treated as an edit.
 * - At most one `persist` runs at a time; edits made during an in-flight save are
 *   not dropped — a trailing save re-fires once the in-flight one settles (so the
 *   server never ends up missing the last burst of edits).
 *
 * @returns {{ status: string }}
 */
export function useAutosave({ data, storageKey, canPersist, persist, delay = 800, enabled = true }) {
  const [status, setStatus] = useState(AUTOSAVE_STATUS.IDLE)
  const first = useRef(true)
  const inFlight = useRef(false)
  const dirty = useRef(false)
  const dataRef = useRef(data)
  const persistRef = useRef(persist)
  const canRef = useRef(canPersist)
  dataRef.current = data
  persistRef.current = persist
  canRef.current = canPersist

  const flush = useCallback(async () => {
    // Local backup always — this is the safety net that survives reloads.
    saveDraft(storageKey, dataRef.current)
    if (!canRef.current) {
      setStatus(AUTOSAVE_STATUS.SAVED_LOCAL)
      return
    }
    // One server save at a time; remember that newer edits arrived meanwhile.
    if (inFlight.current) {
      dirty.current = true
      return
    }
    inFlight.current = true
    setStatus(AUTOSAVE_STATUS.SAVING)
    try {
      await persistRef.current?.(dataRef.current)
      setStatus(AUTOSAVE_STATUS.SAVED)
    } catch {
      setStatus(AUTOSAVE_STATUS.ERROR)
    } finally {
      inFlight.current = false
      // Trailing save: edits made during the in-flight one must still reach the server.
      if (dirty.current) {
        dirty.current = false
        flush()
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (!enabled) return undefined
    if (first.current) {
      first.current = false
      return undefined
    }
    const id = setTimeout(flush, delay)
    return () => clearTimeout(id)
  }, [data, enabled, delay, flush])

  return { status }
}
