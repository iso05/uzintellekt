// Web Storage access can throw — Safari "Private Browsing" (older versions),
// disabled storage, or an exceeded quota all make getItem/setItem raise. These
// wrappers degrade gracefully: reads return null, writes are best-effort no-ops,
// so a storage failure never crashes auth or a render path.

function guard(fn, fallback) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const safeLocalStorage = {
  getItem: (key) => guard(() => localStorage.getItem(key), null),
  setItem: (key, value) => guard(() => localStorage.setItem(key, value)),
  removeItem: (key) => guard(() => localStorage.removeItem(key)),
}

export const safeSessionStorage = {
  getItem: (key) => guard(() => sessionStorage.getItem(key), null),
  setItem: (key, value) => guard(() => sessionStorage.setItem(key, value)),
  clear: () => guard(() => sessionStorage.clear()),
}
