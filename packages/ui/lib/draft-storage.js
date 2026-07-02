import { safeLocalStorage } from '@shared/lib/safe-storage'

// Client-side draft persistence — a safety net so unsaved form input survives a
// reload/navigation even when the backend can't store a partial (invalid) draft.
const PREFIX = 'work_draft_'

export function draftKey(id) {
  return `${PREFIX}${id ?? 'new'}`
}

export function saveDraft(key, data) {
  try {
    safeLocalStorage.setItem(key, JSON.stringify({ t: Date.now(), data }))
  } catch {
    /* storage full / unavailable — local draft is best-effort */
  }
}

export function loadDraft(key) {
  try {
    const raw = safeLocalStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function clearDraft(key) {
  safeLocalStorage.removeItem(key)
}

// Remove every work draft — used on logout so a shared/kiosk device doesn't keep
// a previous user's form data (incl. right-holder passport numbers) in storage.
export function clearAllDrafts() {
  try {
    const doomed = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) doomed.push(k)
    }
    doomed.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
