import { useCallback } from 'react'
import { useGridQuery } from '@shared/hooks/use-grid-query'
import { getUsersGrid } from '@/entities/user'

export const PAGE_SIZE = 10
const SEARCH_MIN_CHARS = 2

export function getGridUserType(user) {
  if (!user) return null

  // 1. Direct explicit fields
  const values = [user.subjectType, user.type, user.userType]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase().trim())

  if (values.includes('LEGAL') || values.includes('YURIDIK') || values.includes('ORGANIZATION')) return 'LEGAL'
  if (values.includes('INDIVIDUAL') || values.includes('PHYSICAL') || values.includes('JISMONIY') || values.includes('PERSON')) {
    return 'INDIVIDUAL'
  }

  // 2. Attribute heuristics if subjectType is omitted in grid projection
  if (user.legalName || (user.inn && !user.pinfl)) return 'LEGAL'
  if (user.pinfl || user.passportSeria || user.firstName || user.lastName) return 'INDIVIDUAL'

  return 'INDIVIDUAL'
}

export function filterUsersByType(users, type) {
  if (!type) return users || []
  return (users || []).filter((user) => getGridUserType(user) === type)
}

// Shared filter builder — used by both the grid loader and the CSV export so the
// exported rows always match what is on screen. state and subjectType are exact-match (eq).
// The backend supports a case-insensitive `lk` (contains) on pinfl or lastName.
export function buildUserFilters({ state, type, role, search } = {}) {
  const filters = []
  if (state) filters.push({ field: 'state', operator: 'eq', value: state })
  if (type) filters.push({ field: 'subjectType', operator: 'eq', value: type })
  if (role) filters.push({ field: 'role', operator: 'eq', value: role })
  const q = search?.trim()
  if (q && q.length >= SEARCH_MIN_CHARS) {
    const field = /^\d+$/.test(q) ? 'pinfl' : 'lastName'
    filters.push({ field, operator: 'lk', value: q })
  }
  return filters
}

export function useUsersQueue({ state, type, role, search, sort, pageSize = PAGE_SIZE } = {}) {
  const fetcher = useCallback(
    async ({ page, size, filters, sort: gridSort }) => {
      const data = await getUsersGrid({ page, size, filters, sort: gridSort })
      if (!type || !data?.items) return data

      // If backend filtered by subjectType, this is a no-op;
      // if backend ignored subjectType filter, this guarantees only the matching type is shown.
      const filtered = filterUsersByType(data.items, type)
      return {
        ...data,
        items: filtered,
      }
    },
    [type]
  )

  return useGridQuery({
    fetcher,
    pageSize,
    filters: buildUserFilters({ state, type, role, search }),
    sort,
  })
}
