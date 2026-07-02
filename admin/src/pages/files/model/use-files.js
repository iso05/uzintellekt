import { useEffect, useState } from 'react'
import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getAdminFilesGrid } from '@/entities/work'
import { getStorageDashboard } from '@/entities/dashboard'

export const PAGE_SIZE = 10

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. Filename search is a starts-with
// match (the grid's `sw` operator) on the stored original file name.
export function buildFileFilters({ status, search }) {
  const filters = []
  if (status) filters.push({ field: 'state', operator: 'eq', value: status })
  if (search?.trim()) filters.push({ field: 'originalFileName', operator: 'sw', value: search.trim() })
  return filters
}

export function useFilesQueue({ status, search, sort } = {}) {
  const q = useGridQuery({
    fetcher: getAdminFilesGrid,
    pageSize: PAGE_SIZE,
    filters: buildFileFilters({ status, search }),
    sort,
  })

  const [quota, setQuota] = useState(null)

  // Storage/quota summary — loaded once, independent of paging.
  useEffect(() => {
    let alive = true
    getStorageDashboard()
      .then((s) => alive && setQuota(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return { ...q, quota }
}
