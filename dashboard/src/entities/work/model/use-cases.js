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
  let data = null
  try {
    data = await getWorksStat()
  } catch (err) {
    // Fallback: If getWorksStat API fails, attempt to calculate from works list
    try {
      const res = await getWorks({ page: 1, size: 100 })
      const items = res?.items ?? res?.data?.items
      if (!Array.isArray(items)) throw err
      let registered = 0
      let pending = 0
      let rejected = 0
      items.forEach((w) => {
        const s = w.state || w.work?.state
        if (s === WORK_STATUS.REGISTERED) registered++
        else if (s === WORK_STATUS.UNDER_REVIEW) pending++
        else if (s === WORK_STATUS.REJECTED) rejected++
      })
      return { total: items.length, registered, pending, rejected }
    } catch {
      throw err
    }
  }

  const byStatus = data?.byStatus ?? {}
  const total = _num(data?.total)
  const registered = _num(byStatus[WORK_STATUS.REGISTERED])
  const pending = _num(byStatus[WORK_STATUS.UNDER_REVIEW])
  const rejected = _num(byStatus[WORK_STATUS.REJECTED])

  // If getWorksStat returns 0 total but items exist in works list (e.g. mock/local dev), fallback count
  if (total === 0 && registered === 0 && pending === 0 && rejected === 0) {
    try {
      const res = await getWorks({ page: 1, size: 100 })
      const items = res?.items ?? res?.data?.items ?? []
      if (items.length > 0) {
        let regCount = 0
        let pendCount = 0
        let rejCount = 0
        items.forEach((w) => {
          const s = w.state || w.work?.state
          if (s === WORK_STATUS.REGISTERED) regCount++
          else if (s === WORK_STATUS.UNDER_REVIEW) pendCount++
          else if (s === WORK_STATUS.REJECTED) rejCount++
        })
        return { total: items.length, registered: regCount, pending: pendCount, rejected: rejCount }
      }
    } catch {
      // Fall through to 0 result
    }
  }

  return { total, registered, pending, rejected }
}

export async function getRecentWorks(size = 5) {
  const res = await getWorks({
    page: 1,
    size,
    sort: { selector: 'createdAt', desc: true },
  })
  return res?.items ?? res?.data?.items ?? []
}
