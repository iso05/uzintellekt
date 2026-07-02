import { describe, it, expect } from 'vitest'
import { buildWorkFilters } from './use-works'

describe('buildWorkFilters', () => {
  it('returns no filters when nothing is set', () => {
    expect(buildWorkFilters()).toEqual([])
    expect(buildWorkFilters({})).toEqual([])
  })

  it('maps status to an eq filter on state', () => {
    expect(buildWorkFilters({ status: 'UNDER_REVIEW' })).toEqual([
      { field: 'state', operator: 'eq', value: 'UNDER_REVIEW' },
    ])
  })

  it('maps a search to a contains filter on name', () => {
    expect(buildWorkFilters({ search: 'tech' })).toEqual([
      { field: 'name', operator: 'lk', value: 'tech' },
    ])
  })

  it('ignores a search shorter than the minimum', () => {
    expect(buildWorkFilters({ search: 't' })).toEqual([])
  })

  it('combines status and search', () => {
    expect(buildWorkFilters({ status: 'REGISTERED', search: 'abc' })).toEqual([
      { field: 'state', operator: 'eq', value: 'REGISTERED' },
      { field: 'name', operator: 'lk', value: 'abc' },
    ])
  })
})
