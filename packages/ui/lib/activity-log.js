import { safeLocalStorage } from './safe-storage'

// Client-side audit trail: the backend exposes no audit API, so key admin
// actions are recorded locally (per browser) as a capped ring buffer.
const KEY = 'admin_activity_log'
const MAX = 100

export function getActivityLog() {
  try {
    const raw = safeLocalStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * Record an action. `type` is an i18n key suffix (e.g. 'work.decide'); `target`
 * is a human-readable label; `meta` holds extra detail (decision, filename…).
 */
export function logActivity(type, target, meta) {
  try {
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, target: target || '', meta: meta || null, at: new Date().toISOString() }
    const next = [entry, ...getActivityLog()].slice(0, MAX)
    safeLocalStorage.setItem(KEY, JSON.stringify(next))
    return entry
  } catch {
    return null
  }
}

export function clearActivityLog() {
  safeLocalStorage.removeItem(KEY)
}
