import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// Node 22+ ships an experimental localStorage that conflicts with jsdom/happy-dom.
// Install a clean in-memory polyfill so every test starts from a known state.
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

beforeEach(() => {
  globalThis.localStorage.clear()
  globalThis.sessionStorage.clear()
})
