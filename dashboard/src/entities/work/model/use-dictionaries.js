import { useEffect, useState } from 'react'
import { resolveLocalizedName } from '@/shared/lib/localized-name'
import { getWorkTypes, getAuthorRoles } from '../api'

let _cache = null
let _inFlight = null

async function _loadAll() {
  if (_cache) return _cache
  if (_inFlight) return _inFlight
  _inFlight = Promise.all([getWorkTypes(), getAuthorRoles()])
    .then(([wt, ar]) => {
      _cache = {
        workTypes: wt?.content ?? wt ?? [],
        authorRoles: ar?.content ?? ar ?? [],
      }
      return _cache
    })
    .catch((e) => {
      _inFlight = null
      throw e
    })
  return _inFlight
}

/**
 * Module-level cache: dictionaries are static — fetch once per session,
 * share across all consumers (WorksList, WorkForm, detail dialog).
 */
export function useDictionaries() {
  const [data, setData] = useState(_cache)
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache) return
    let alive = true
    _loadAll()
      .then((d) => alive && setData(d))
      .catch((e) => console.error("Lug'atlarni yuklash xatosi:", e))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return {
    workTypes: data?.workTypes ?? [],
    authorRoles: data?.authorRoles ?? [],
    loading,
  }
}

export function resolveWorkTypeName(workTypes, typeId) {
  const t = workTypes.find((x) => Number(x.id) === Number(typeId))
  if (!t) return '—'
  return resolveLocalizedName(t.localizedName, t.name) || '—'
}

export function resolveAuthorRoleNames(authorRoles, roleIds = []) {
  return roleIds
    .map((id) => {
      const r = authorRoles.find((x) => Number(x.id) === Number(id))
      return r ? resolveLocalizedName(r.localizedName, r.name) || null : null
    })
    .filter(Boolean)
    .join(', ') || '—'
}
