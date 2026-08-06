import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getWorksGrid } from '@/entities/work'

export const PAGE_SIZE = 10
const SEARCH_MIN_CHARS = 2

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. `status` is an exact-match on
// state; `search` is a case-insensitive contains (`lk`) on the work name.
export function buildWorkFilters({ status, search } = {}) {
  const filters = []
  if (status) filters.push({ field: 'state', operator: 'eq', value: status })
  const q = search?.trim()
  if (q && q.length >= SEARCH_MIN_CHARS) filters.push({ field: 'name', operator: 'lk', value: q })
  return filters
}

// Loads a page of the works grid, optionally filtered by state and name.
export function useWorksQueue({ status, search, sort, pageSize = PAGE_SIZE } = {}) {
  return useGridQuery({
    fetcher: getWorksGrid,
    pageSize,
    filters: buildWorkFilters({ status, search }),
    sort,
  })
}
