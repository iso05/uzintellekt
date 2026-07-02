import { useCallback, useEffect, useState } from 'react'
import {
  getWorksDashboard,
  getUsersDashboard,
  getModerationDashboard,
  getStorageDashboard,
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

/**
 * Loads every period-scoped block of the dashboard in parallel. Refetches when
 * the period preset changes. A top-level error is surfaced only when the core
 * works call fails, so transient gaps degrade to empty sections.
 */
export function useDashboardSummary(period) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async (isActive = () => true) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { from, to } = period
    const prev = previousRange(period)

    const [works, users, moderation, storage, topContributors, topStorage, workTypes, prevWorks, prevUsers] =
      await Promise.allSettled([
        getWorksDashboard({ from, to }),
        getUsersDashboard({ from, to }),
        getModerationDashboard({ from, to }),
        getStorageDashboard(),
        getTopContributors({ from, to, limit: 5 }),
        getTopStorage({ limit: 5 }),
        getWorkTypes(),
        getWorksDashboard({ from: prev.from, to: prev.to }),
        getUsersDashboard({ from: prev.from, to: prev.to }),
      ])

    const worksVal = valueOr(works)
    const usersVal = valueOr(users)
    const prevWorksVal = valueOr(prevWorks)
    const prevUsersVal = valueOr(prevUsers)

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
      moderation: valueOr(moderation),
      storage: valueOr(storage),
      topContributors: valueOr(topContributors, []),
      topStorage: valueOr(topStorage, []),
      workTypes: valueOr(workTypes, []),
      deltas,
    }

    const allFailed =
      works.status === 'rejected' &&
      users.status === 'rejected' &&
      moderation.status === 'rejected' &&
      storage.status === 'rejected'

    if (isActive())
      setState({
        loading: false,
        error: allFailed ? works.reason?.message || 'error' : null,
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
