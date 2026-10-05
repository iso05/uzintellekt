import { requestJson } from '@shared/api'
import { formatDate } from '@shared/lib/format'

const BASE = '/api/v1/admin/dashboard'

// Dashboard endpoints speak dd.MM.yyyy for every date (query params and bodies).
function qs(params) {
  const parts = []
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue
    const v = value instanceof Date ? formatDate(value) : value
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

export function getOverviewDashboard({ from, to } = {}) {
  return requestJson(`${BASE}/overview${qs({ from, to })}`)
}

// Storage totals are provided by the `storage` block of the supported,
// range-scoped overview response. There is no standalone /dashboard/storage API.
export async function getStorageSummary({ from, to }) {
  const overview = await getOverviewDashboard({ from, to })
  return overview?.storage ?? null
}

export function getWorksSeries({ from, to, granularity = 'DAY', metric } = {}) {
  return requestJson(`${BASE}/works/series${qs({ from, to, granularity, metric })}`)
}

export function getUsersSeries({ from, to, granularity = 'DAY' } = {}) {
  return requestJson(`${BASE}/users/series${qs({ from, to, granularity })}`)
}

export function getModerationSeries({ from, to, granularity = 'DAY', metric } = {}) {
  return requestJson(`${BASE}/moderation/series${qs({ from, to, granularity, metric })}`)
}

export function getTopContributors({ from, to, limit = 5 } = {}) {
  return requestJson(`${BASE}/top/contributors${qs({ from, to, limit })}`)
}

export function getTopStorage({ limit = 5 } = {}) {
  return requestJson(`${BASE}/top/storage${qs({ limit })}`)
}
