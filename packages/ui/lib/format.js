function _pad(n) {
  return String(n).padStart(2, '0')
}

// Parse the date shapes the backend actually sends. It returns dates as
// `DD.MM.YYYY` or `DD.MM.YYYY HH:MM:SS` (NOT ISO) — `new Date()` can't parse
// those, so without this they'd fall through to a raw string (with seconds),
// rendering inconsistently next to any ISO value. Handles both, plus Date.
function _parse(input) {
  if (input == null || input === '') return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  const s = String(input).trim()
  // Backend "[D]D.[M]M.YYYY [[H]H:[M]M[:[S]S]]" — allow single-digit parts too;
  // the explicit numeric Date(...) below handles unpadded values correctly.
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (m) {
    const [, dd, mo, yyyy, hh = '0', mi = '0', ss = '0'] = m
    const d = new Date(+yyyy, +mo - 1, +dd, +hh, +mi, +ss)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // Only trust ISO 8601 for the generic branch — feeding other shapes (e.g.
  // "01/02/2026") to new Date() lets the engine guess MM/DD and silently swap
  // day/month. Anything else is treated as unparseable (rendered raw).
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/.test(s)) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function formatDate(input) {
  const d = _parse(input)
  if (!d) return input ? String(input) : '—'
  return `${_pad(d.getDate())}.${_pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function formatDateTime(input) {
  const d = _parse(input)
  if (!d) return input ? String(input) : '—'
  return `${formatDate(d)} ${_pad(d.getHours())}:${_pad(d.getMinutes())}`
}

export function todayLocalized() {
  return formatDate(new Date())
}

// Convert "DD.MM.YYYY" or Date to backend ISO date string "YYYY-MM-DD"
export function toIsoDate(input) {
  if (!input) return ''
  const d = _parse(input)
  if (!d) return String(input).trim()
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`
}

// Human-readable byte size (binary units). 0 → "0 B".
export function formatBytes(bytes, decimals = 1) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  const value = n / Math.pow(1024, i)
  const rounded = i === 0 ? Math.round(value) : Number(value.toFixed(decimals))
  return `${rounded} ${units[i]}`
}

// Thousands-grouped integer. The separator is a non-breaking space (U+00A0) so a
// grouped number never wraps mid-value — matches ru/uz typographic conventions.
export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
