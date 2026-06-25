const TTL_MS = 30_000
// Bound the cache so a long session of distinct searches/filters/pages cannot
// grow it without limit. Map preserves insertion order, so the first key is the
// least-recently-used; reads/writes re-insert to refresh recency (LRU).
const MAX_ENTRIES = 100

const cache = new Map()

export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  // Touch: move to the most-recently-used position.
  cache.delete(key)
  cache.set(key, entry)
  return entry.data
}

export function setCached(key, data) {
  cache.delete(key) // re-insert at the end (most recently used)
  cache.set(key, { data, timestamp: Date.now() })
  if (cache.size > MAX_ENTRIES) {
    cache.delete(cache.keys().next().value) // evict least-recently-used
  }
}

// Keys are built as `${endpoint}:${JSON.stringify(params)}` (see grid.js). Match
// on the exact endpoint prefix so invalidating `/works/grid` never collides with
// a different endpoint like `/works/grid-export`, nor with the serialized params.
export function invalidateCache(endpoint) {
  for (const key of cache.keys()) {
    if (key === endpoint || key.startsWith(`${endpoint}:`)) cache.delete(key)
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
