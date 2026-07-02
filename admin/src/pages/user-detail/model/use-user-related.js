import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getWorksGrid } from '@/entities/work'
import { getContractsGrid } from '@/entities/contract'

// Compact page size for the summary lists on the user card — the dedicated
// Moderation/Contracts pages own the full-size grids.
export const RELATED_PAGE_SIZE = 5

// A user's works, paginated. Works are linked by `createdBy` (the authoring user
// — confirmed to match the right-holder userId).
export function useUserWorks(userId) {
  return useGridQuery({
    fetcher: getWorksGrid,
    pageSize: RELATED_PAGE_SIZE,
    filters: userId ? [{ field: 'createdBy', operator: 'eq', value: userId }] : [],
    sort: { selector: 'createdAt', desc: true },
  })
}

// A user's contracts, paginated. Linked by `userId`.
export function useUserContracts(userId) {
  return useGridQuery({
    fetcher: getContractsGrid,
    pageSize: RELATED_PAGE_SIZE,
    filters: userId ? [{ field: 'userId', operator: 'eq', value: userId }] : [],
    sort: { selector: 'signedAt', desc: true },
  })
}
