// Domain model + validation/formatting helpers for work files. No React, no I/O —
// pure functions so they can be unit-tested and reused by the upload queue (Phase 2)
// and the files widget (Phase 3).

export const WORK_FILE_STATUS = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  // Object purged by the 3-day retention on DRAFT/REJECTED works — the row still
  // comes back so we can show a "storage expired, re-upload" tombstone.
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED',
}

// Whitelist of accepted file types. Size is bounded only by the storage quota,
// not by a per-file limit. The extension is the primary gate (browsers sometimes
// report an empty/incorrect file.type). For now only documents are allowed.
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']

// For the <input type="file" accept="..."> attribute.
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')

export function getFileExtension(filename) {
  const name = String(filename || '')
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function isAllowedFile(file) {
  const ext = getFileExtension(file?.name)
  return ext !== '' && ALLOWED_EXTENSIONS.includes(ext)
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * Human-readable byte size, e.g. 1536 → "1.5 KB".
 * Unit suffixes default to English; the UI can pass localized labels.
 */
export function formatBytes(bytes, { decimals = 1, units = UNITS } = {}) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return `0 ${units[0]}`
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const value = n / 1024 ** i
  // Whole numbers render without trailing zeros (e.g. "1 KB", not "1.0 KB").
  const rounded = Number(value.toFixed(decimals))
  return `${rounded} ${units[i]}`
}

/** Quota fill as an integer percent in [0, 100]. */
export function quotaPercent(usedBytes, limitBytes) {
  const used = Number(usedBytes)
  const limit = Number(limitBytes)
  if (!Number.isFinite(limit) || limit <= 0) return 0
  if (!Number.isFinite(used) || used <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

/** Keep only usable files (status === UPLOADED). */
export function onlyUploaded(files) {
  if (!Array.isArray(files)) return []
  return files.filter((f) => f?.status === WORK_FILE_STATUS.UPLOADED)
}

/** Files worth showing: usable (UPLOADED) + tombstones (EXPIRED). Hides PENDING/DELETED. */
export function visibleWorkFiles(files) {
  if (!Array.isArray(files)) return []
  return files.filter(
    (f) => f?.status === WORK_FILE_STATUS.UPLOADED || f?.status === WORK_FILE_STATUS.EXPIRED
  )
}

/** A work can be submitted only if it has at least one usable (UPLOADED) file. */
export function hasUploadedFile(files) {
  return onlyUploaded(files).length > 0
}

/**
 * Does a new file fit in the remaining quota, accounting for bytes already
 * queued but not yet confirmed? Used to pre-flight an upload before init.
 */
export function fitsInQuota(fileSize, remainingBytes, pendingBytes = 0) {
  const size = Number(fileSize)
  const remaining = Number(remainingBytes)
  const pending = Number(pendingBytes) || 0
  if (!Number.isFinite(size) || size <= 0) return false
  // remaining may be Infinity ("no/unknown limit") → always fits; only NaN is invalid.
  if (Number.isNaN(remaining)) return false
  return size <= remaining - pending
}
