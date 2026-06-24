import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import '@/i18n'

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }
  get length() {
    return this.store.size
  }
  key(i) {
    return Array.from(this.store.keys())[i] ?? null
  }
  getItem(k) {
    return this.store.has(String(k)) ? this.store.get(String(k)) : null
  }
  setItem(k, v) {
    this.store.set(String(k), String(v))
  }
  removeItem(k) {
    this.store.delete(String(k))
  }
  clear() {
    this.store.clear()
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
})

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  )
}

if (!globalThis.scrollTo) {
  globalThis.scrollTo = vi.fn()
}
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn()
}

if (!globalThis.matchMedia) {
  globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  globalThis.localStorage.clear()
  globalThis.sessionStorage.clear()
})
