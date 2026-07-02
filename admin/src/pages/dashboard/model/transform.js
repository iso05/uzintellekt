import { formatDate } from '@shared/lib/format'

/**
 * TimeSeriesResponse { granularity, points: [{ bucket, value }] } → recharts rows.
 * `bucket` is kept raw for the x-axis key; `label` is a friendlier rendering
 * (formatDate understands the backend's dd.MM.yyyy and ISO buckets, and leaves
 * month buckets like "2026-07" untouched).
 */
export function toChartSeries(series) {
  const points = series?.points
  if (!Array.isArray(points)) return []
  return points.map((p) => ({
    bucket: p.bucket,
    label: formatDate(p.bucket),
    value: Number(p.value) || 0,
  }))
}

/**
 * A "counts by X" object { KEY: count } → sorted recharts rows [{ key, name, value }].
 * `labels` maps raw keys to display names; `order` fixes the sequence (unknown
 * keys are appended in their original order).
 */
export function distributionData(counts, { labels = {}, order } = {}) {
  if (!counts || typeof counts !== 'object') return []
  const keys = Object.keys(counts)
  const sorted = order
    ? [...keys].sort((a, b) => {
        const ia = order.indexOf(a)
        const ib = order.indexOf(b)
        return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib)
      })
    : keys
  return sorted.map((key) => ({
    key,
    name: labels[key] || key,
    value: Number(counts[key]) || 0,
  }))
}

// Sum of a counts object's values — used for "total" fallbacks.
export function sumValues(counts) {
  if (!counts || typeof counts !== 'object') return 0
  return Object.values(counts).reduce((acc, v) => acc + (Number(v) || 0), 0)
}
