import { request } from './http'
import { getCached, setCached } from './cache'

// Tracks in-flight requests by cacheKey so parallel callers share one network roundtrip.
// Promise is removed on settle (success or failure); only successful results go into the TTL cache.
const _inflight = new Map()

export async function cachedGridGet(endpoint, gridParams) {
  const cacheKey = `${endpoint}:${JSON.stringify(gridParams)}`

  const cached = getCached(cacheKey)
  if (cached) return cached

  const pending = _inflight.get(cacheKey)
  if (pending) return pending

  const promise = (async () => {
    const gridRequest = encodeURIComponent(JSON.stringify(gridParams))
    const url = `${endpoint}?gridRequest=${gridRequest}`
    const res = await request(url, { method: 'GET' })
    const ct = res.headers.get('content-type')
    const data = ct && ct.includes('application/json') ? await res.json() : null
    setCached(cacheKey, data)
    return data
  })().finally(() => {
    _inflight.delete(cacheKey)
  })

  _inflight.set(cacheKey, promise)
  return promise
}
