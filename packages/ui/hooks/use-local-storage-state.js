import { useState } from 'react'

/**
 * A reusable hook to persist React state in localStorage.
 * Loads the saved value on mount, and updates localStorage when the state changes.
 */
export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn('Error reading localStorage key:', key, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value
      setState(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn('Error setting localStorage key:', key, error)
    }
  }

  return [state, setValue]
}
