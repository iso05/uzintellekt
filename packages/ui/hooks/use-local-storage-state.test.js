import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorageState } from './use-local-storage-state'

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('returns initialValue when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorageState('test_key', 'default_value'))
    const [value] = result.current
    expect(value).toBe('default_value')
    expect(window.localStorage.getItem('test_key')).toBeNull()
  })

  it('loads saved value from localStorage', () => {
    window.localStorage.setItem('test_key', JSON.stringify('saved_value'))
    const { result } = renderHook(() => useLocalStorageState('test_key', 'default_value'))
    const [value] = result.current
    expect(value).toBe('saved_value')
  })

  it('updates state and localStorage on setValue call', () => {
    const { result } = renderHook(() => useLocalStorageState('test_key', 'default_value'))
    const [, setValue] = result.current

    act(() => {
      setValue('new_value')
    })

    const [value] = result.current
    expect(value).toBe('new_value')
    expect(JSON.parse(window.localStorage.getItem('test_key'))).toBe('new_value')
  })

  it('supports updater function syntax in setValue', () => {
    const { result } = renderHook(() => useLocalStorageState('test_key', 10))
    const [, setValue] = result.current

    act(() => {
      setValue((prev) => prev + 5)
    })

    const [value] = result.current
    expect(value).toBe(15)
    expect(JSON.parse(window.localStorage.getItem('test_key'))).toBe(15)
  })
})
