import { getWorks, getWorksStat } from '../api'
import { WORK_STATUS } from './status'

function _num(v) {
  return Number(v) || 0
}

// Backed by GET /api/v1/works/stat — one role-scoped aggregate request that
// replaced the old fan-out of 4 size:1 grid queries. Flattens byStatus into
// the { total, registered, pending, rejected } keys the WorksStats cards
// consume. (The endpoint also returns a per-type byType breakdown, omitted
// here — it duplicates the cards on a single author's dashboard.)
export async function getWorksStats() {
  const data = await getWorksStat()
  const byStatus = data?.byStatus ?? {}

  return {
    total: _num(data?.total),
    registered: _num(byStatus[WORK_STATUS.REGISTERED]),
    pending: _num(byStatus[WORK_STATUS.PENDING]),
    rejected: _num(byStatus[WORK_STATUS.REJECTED]),
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
