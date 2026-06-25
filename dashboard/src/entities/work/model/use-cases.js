import { getWorks } from '../api'
import { WORK_STATUS } from './status'

function _count(res) {
  return res?.totalItems ?? res?.data?.totalItems ?? 0
}

// NOTE: today this fans out 4 grid queries with size:1 because the backend
// does not yet expose a /works/stats endpoint. When it does, swap the body
// for a single request — call sites stay the same.
export async function getWorksStats() {
  const stateQuery = (state) => ({
    page: 1,
    size: 1,
    filters: [{ field: 'state', operator: 'eq', value: state }],
  })

  // Let failures propagate — swallowing them per-query silently under-reports
  // counts, which is worse than surfacing the error to the caller.
  const [totalRes, regRes, pendRes, rejRes] = await Promise.all([
    getWorks({ page: 1, size: 1 }),
    getWorks(stateQuery(WORK_STATUS.REGISTERED)),
    getWorks(stateQuery(WORK_STATUS.PENDING)),
    getWorks(stateQuery(WORK_STATUS.REJECTED)),
  ])

  return {
    total: _count(totalRes),
    registered: _count(regRes),
    pending: _count(pendRes),
    rejected: _count(rejRes),
  }
}

export async function getRecentWorks(size = 5) {
  const res = await getWorks({
    page: 1,
    size,
    sort: { selector: 'createdAt', desc: true },
  })
  return res?.items ?? res?.data?.items ?? []
}
