const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  const isExpired = Date.now() - entry.timestamp > 30_000; // 30 seconds
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function invalidateCache(pattern) {
  // Invalidate all cache entries whose key contains pattern
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export function clearAllCache() {
  cache.clear();
}

// Dev cache exposure
if (typeof window !== 'undefined') {
  window.__apiCache = {
    getAll: () => Object.fromEntries(cache.entries()),
    clear: () => cache.clear(),
    size: () => cache.size
  };
}
