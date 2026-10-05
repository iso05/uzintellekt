import { useEffect, useState } from 'react'
import { useGridQuery } from '@shared/hooks/use-grid-query'
import { formatDate } from '@shared/lib/format'
import { getAdminFilesGrid } from '@/entities/work'
import { getStorageSummary } from '@/entities/dashboard'

export const PAGE_SIZE = 10

function currentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { from: formatDate(from), to: formatDate(to) }
}

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. Filename search is a starts-with
// match (the grid's `sw` operator) on the stored original file name.
export function buildFileFilters({ status, search }) {
  const filters = []
  if (status) filters.push({ field: 'state', operator: 'eq', value: status })
  if (search?.trim()) filters.push({ field: 'originalFileName', operator: 'sw', value: search.trim() })
  return filters
}

export function useFilesQueue({ status, search, sort, pageSize = PAGE_SIZE } = {}) {
  const q = useGridQuery({
    fetcher: getAdminFilesGrid,
    pageSize,
    filters: buildFileFilters({ status, search }),
    sort,
  })

  const [quota, setQuota] = useState(null)

  // Storage/quota summary — loaded once, independent of paging.
  useEffect(() => {
    let alive = true
    getStorageSummary(currentMonthRange())
      .then((s) => alive && setQuota(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return { ...q, quota }
}
