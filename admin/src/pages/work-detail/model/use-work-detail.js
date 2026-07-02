import { useCallback, useEffect, useState } from 'react'
import { getWorkById, getAdminWorkFiles } from '@/entities/work'

// Loads a work (via the grid) together with its admin file list. A failed file
// fetch degrades to an empty list rather than blanking the whole page.
export function useWorkDetail(workId) {
  const [state, setState] = useState({ loading: true, error: null, work: null, files: [] })

  const load = useCallback(async (isActive = () => true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [work, files] = await Promise.all([
        getWorkById(workId),
        getAdminWorkFiles(workId).catch(() => []),
      ])
      if (!isActive()) return
      if (!work) {
        setState({ loading: false, error: 'not_found', work: null, files: [] })
        return
      }
      setState({ loading: false, error: null, work, files: Array.isArray(files) ? files : [] })
    } catch (err) {
      if (isActive()) setState({ loading: false, error: err?.message || 'error', work: null, files: [] })
    }
  }, [workId])

  useEffect(() => {
    let alive = true
    load(() => alive)
    return () => {
      alive = false
    }
  }, [load])

  return { ...state, reload: load }
}
