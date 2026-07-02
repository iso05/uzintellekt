import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorkTypes, getAuthorRoles, localizedName } from '../api'

// Loads a dictionary once and returns an { id: localizedLabel } map keyed to the
// active language. A failed fetch leaves the map empty (callers fall back to id).
function useDictMap(fetcher) {
  const { i18n } = useTranslation()
  const [map, setMap] = useState({})

  useEffect(() => {
    let alive = true
    fetcher()
      .then((list) => {
        if (!alive) return
        const next = {}
        for (const entry of list) next[entry.id] = localizedName(entry, i18n.language)
        setMap(next)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [fetcher, i18n.language])

  return map
}

export function useWorkTypeMap() {
  return useDictMap(getWorkTypes)
}

export function useAuthorRoleMap() {
  return useDictMap(getAuthorRoles)
}

// Same data as the maps, but as an ordered [{ id, label }] list for <Select>/
// multi-select controls.
function useDictOptions(fetcher) {
  const { i18n } = useTranslation()
  const [options, setOptions] = useState([])

  useEffect(() => {
    let alive = true
    fetcher()
      .then((list) => {
        if (!alive) return
        setOptions(
          [...list]
            .sort((a, b) => a.id - b.id)
            .map((entry) => ({ id: entry.id, label: localizedName(entry, i18n.language) }))
        )
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [fetcher, i18n.language])

  return options
}

export function useWorkTypeOptions() {
  return useDictOptions(getWorkTypes)
}

export function useAuthorRoleOptions() {
  return useDictOptions(getAuthorRoles)
}
