import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getContractsGrid } from '@/entities/contract'

export const PAGE_SIZE = 10

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. Number search is a starts-with
// match (the grid's `sw` operator) on the contract number.
export function buildContractFilters({ type, state, search }) {
  const filters = []
  if (type) filters.push({ field: 'type', operator: 'eq', value: type })
  if (state) filters.push({ field: 'state', operator: 'eq', value: state })
  if (search?.trim()) filters.push({ field: 'number', operator: 'sw', value: search.trim() })
  return filters
}

export function useContractsQueue({ type, state, search, sort, pageSize = PAGE_SIZE } = {}) {
  return useGridQuery({
    fetcher: getContractsGrid,
    pageSize,
    filters: buildContractFilters({ type, state, search }),
    sort,
  })
}
