import { useEffect, useState } from 'react'

// Returns a debounced copy of `value` that only updates after `delay` ms of
// quiet — used to avoid firing a grid request on every keystroke.
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
