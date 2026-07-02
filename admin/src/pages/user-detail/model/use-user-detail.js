import { useCallback, useEffect, useState } from 'react'
import { getUserById } from '@/entities/user'

export function useUserDetail(userId) {
  const [state, setState] = useState({ loading: true, error: null, user: null })

  const load = useCallback(async (isActive = () => true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const user = await getUserById(userId)
      if (isActive()) setState({ loading: false, error: user ? null : 'not_found', user })
    } catch (err) {
      if (isActive()) setState({ loading: false, error: err?.message || 'error', user: null })
    }
  }, [userId])

  useEffect(() => {
    let alive = true
    load(() => alive)
    return () => {
      alive = false
    }
  }, [load])

  return { ...state, reload: load }
}
