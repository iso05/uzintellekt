import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getUsersGrid } from '@/entities/user'

export const PAGE_SIZE = 10
const SEARCH_MIN_CHARS = 2

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. state/type are exact-match. The
// backend supports a case-insensitive `lk` (contains) only on a single field per
// request (filters are ANDed), and phone is not filterable — so the search box
// routes by input: an all-digits query searches PINFL, otherwise the surname.
export function buildUserFilters({ state, type, role, search }) {
  const filters = []
  if (state) filters.push({ field: 'state', operator: 'eq', value: state })
  if (type) filters.push({ field: 'type', operator: 'eq', value: type })
  if (role) filters.push({ field: 'role', operator: 'eq', value: role })
  const q = search?.trim()
  if (q && q.length >= SEARCH_MIN_CHARS) {
    const field = /^\d+$/.test(q) ? 'pinfl' : 'lastName'
    filters.push({ field, operator: 'lk', value: q })
  }
  return filters
}

export function useUsersQueue({ state, type, role, search, sort, pageSize = PAGE_SIZE } = {}) {
  return useGridQuery({
    fetcher: getUsersGrid,
    pageSize,
    filters: buildUserFilters({ state, type, role, search }),
    sort,
  })
}
