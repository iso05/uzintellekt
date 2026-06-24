const TTL_MS = 30_000

const cache = new Map()

export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

export function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key)
  }
}

export function clearAllCache() {
  cache.clear()
}

if (typeof window !== 'undefined') {
  window.__apiCache = {
    getAll: () => Object.fromEntries(cache.entries()),
    clear: () => cache.clear(),
    size: () => cache.size,
  }
}
