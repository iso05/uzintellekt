// A period is a resolved range object: { key, from, to }. `key` is one of the
// presets below or 'custom'. `from`/`to` are Date objects (`to` is "now" for
// presets). Granularity is derived from the span, not chosen by hand, so a
// coarse bucket is never applied to a range too short to fill it.
export const PERIOD_PRESETS = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
]

export const DEFAULT_PERIOD_KEY = '30d'
export const CUSTOM_KEY = 'custom'

const DAY_MS = 86400000

function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export function makePreset(key) {
  const preset =
    PERIOD_PRESETS.find((p) => p.key === key) || PERIOD_PRESETS.find((p) => p.key === DEFAULT_PERIOD_KEY)
  return { key: preset.key, from: daysAgo(preset.days), to: new Date() }
}

export function makeCustom(from, to) {
  // Normalise so `from` <= `to`.
  const [a, b] = from <= to ? [from, to] : [to, from]
  return { key: CUSTOM_KEY, from: a, to: b }
}

export const DEFAULT_PERIOD = makePreset(DEFAULT_PERIOD_KEY)

export function spanDays(from, to) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS))
}

// Auto-scale the bucket size so a line always has a sensible number of points:
// up to ~6 weeks daily, up to ~6 months weekly, longer ranges monthly.
export function granularityForRange(from, to) {
  const days = spanDays(from, to)
  if (days <= 45) return 'DAY'
  if (days <= 180) return 'WEEK'
  return 'MONTH'
}

// The equally-sized window immediately before the current one (for comparison).
export function previousRange({ from, to }) {
  const span = to.getTime() - from.getTime()
  return { from: new Date(from.getTime() - span), to: new Date(from.getTime()) }
}

// Percent change of current vs previous. 0 prev → +100% if any current, else 0.
export function deltaPct(current, previous) {
  const c = Number(current) || 0
  const p = Number(previous) || 0
  if (p === 0) return c > 0 ? 100 : 0
  return Math.round(((c - p) / p) * 100)
}
