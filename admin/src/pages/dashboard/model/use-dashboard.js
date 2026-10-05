import { useCallback, useEffect, useState } from 'react'
import {
  getOverviewDashboard,
  getTopContributors,
  getTopStorage,
  getWorksSeries,
} from '@/entities/dashboard'
import { getWorkTypes } from '@/entities/dictionary'
import { previousRange, deltaPct } from './periods'

// Resolve one settled promise to its value or null (a single failing endpoint
// must not blank the whole dashboard — that section just renders empty).
function valueOr(result, fallback = null) {
  return result.status === 'fulfilled' ? result.value : fallback
}

export function processWorksData(worksRaw) {
  if (!worksRaw) return null
  if (worksRaw.rows && Array.isArray(worksRaw.rows)) {
    const byStatus = {}
    const typeTotals = {}
    let total = 0
    for (const r of worksRaw.rows) {
      const cnt = Number(r.count || r.total) || 0
      total += cnt
      // WorkStatRowResponse uses `status`; keep `state` only as a backwards
      // compatible fallback for older dashboard responses.
      const status = r.status || r.state
      if (status) {
        byStatus[status] = (byStatus[status] || 0) + cnt
      }
      if (r.workTypeId) {
        typeTotals[r.workTypeId] = (typeTotals[r.workTypeId] || 0) + cnt
      }
    }
    const byType = Object.entries(typeTotals).map(([wtId, cnt]) => ({
      workTypeId: Number(wtId),
      total: cnt,
    }))
    return {
      total: worksRaw.total ?? total,
      byStatus: worksRaw.byStatus || byStatus,
      byType: worksRaw.byType || byType,
      period: worksRaw.period || { created: 0 },
    }
  }
  return worksRaw
}

function processUsersData(usersRaw) {
  if (!usersRaw) return null
  if (usersRaw.rows && Array.isArray(usersRaw.rows)) {
    const byState = {}
    let total = 0
    for (const r of usersRaw.rows) {
      const cnt = Number(r.count || r.total) || 0
      total += cnt
      if (r.state) {
        byState[r.state] = (byState[r.state] || 0) + cnt
      }
    }
    return {
      total: usersRaw.total ?? total,
      byState: usersRaw.byState || byState,
      period: usersRaw.period || { registered: 0 },
    }
  }
  return usersRaw
}

/**
 * Loads every period-scoped block of the dashboard in parallel. Refetches when
 * the period preset changes. A top-level error is surfaced only when the core
 * overview call fails.
 */
export function useDashboardSummary(period) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async (isActive = () => true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { from, to } = period
    const prev = previousRange(period)

    const [overview, topContributors, topStorage, workTypes, prevOverview] =
      await Promise.allSettled([
        getOverviewDashboard({ from, to }),
        getTopContributors({ from, to, limit: 5 }),
        getTopStorage({ limit: 5 }),
        getWorkTypes(),
        getOverviewDashboard({ from: prev.from, to: prev.to }),
      ])

    const overviewVal = valueOr(overview)
    const prevOverviewVal = valueOr(prevOverview)

    const worksVal = processWorksData(overviewVal?.works)
    const usersVal = processUsersData(overviewVal?.users)
    const moderationVal = overviewVal?.moderation
    const storageVal = overviewVal?.storage

    const prevWorksVal = processWorksData(prevOverviewVal?.works)
    const prevUsersVal = processUsersData(prevOverviewVal?.users)

    // Period-over-period deltas (null when the previous period failed to load).
    const deltas = {
      worksCreated:
        prevWorksVal && worksVal
          ? deltaPct(worksVal.period?.created, prevWorksVal.period?.created)
          : null,
      usersRegistered:
        prevUsersVal && usersVal
          ? deltaPct(usersVal.period?.registered, prevUsersVal.period?.registered)
          : null,
    }

    const data = {
      works: worksVal,
      users: usersVal,
      moderation: moderationVal,
      storage: storageVal,
      topContributors: valueOr(topContributors, []),
      topStorage: valueOr(topStorage, []),
      workTypes: valueOr(workTypes, []),
      deltas,
    }

    const failed = overview.status === 'rejected'

    if (isActive())
      setState({
        loading: false,
        error: failed ? overview.reason?.message || 'error' : null,
        data,
      })
  }, [period])

  useEffect(() => {
    let alive = true
    load(() => alive)
    return () => {
      alive = false
    }
  }, [load])

  return { ...state, reload: load }
}

/**
 * Loads the works time-series independently of the summary so toggling metric or
 * granularity doesn't refetch the cards.
 */
export function useWorksSeries(period, granularity, metric) {
  const [state, setState] = useState({ loading: true, error: null, series: null })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    const { from, to } = period

    getWorksSeries({ from, to, granularity, metric })
      .then((series) => {
        if (alive) setState({ loading: false, error: null, series })
      })
      .catch((err) => {
        if (alive) setState({ loading: false, error: err?.message || 'error', series: null })
      })

    return () => {
      alive = false
    }
  }, [period, granularity, metric])

  return state
}
