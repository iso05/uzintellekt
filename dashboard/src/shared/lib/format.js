function _pad(n) {
  return String(n).padStart(2, '0')
}

export function formatDate(input) {
  if (!input) return '—'
  const d = new Date(input)
  if (isNaN(d.getTime())) return String(input)
  return `${_pad(d.getDate())}.${_pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function formatDateTime(input) {
  if (!input) return '—'
  const d = new Date(input)
  if (isNaN(d.getTime())) return String(input)
  return `${formatDate(d)} ${_pad(d.getHours())}:${_pad(d.getMinutes())}`
}

export function todayLocalized() {
  return formatDate(new Date())
}
