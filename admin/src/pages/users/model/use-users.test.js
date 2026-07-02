import { describe, it, expect } from 'vitest'
import { buildUserFilters } from './use-users'

describe('buildUserFilters', () => {
  it('returns no filters when nothing is set', () => {
    expect(buildUserFilters({})).toEqual([])
  })

  it('maps state and type to eq filters', () => {
    expect(buildUserFilters({ state: 'BLOCKED', type: 'LEGAL' })).toEqual([
      { field: 'state', operator: 'eq', value: 'BLOCKED' },
      { field: 'type', operator: 'eq', value: 'LEGAL' },
    ])
  })

  it('routes a text search to a contains filter on lastName', () => {
    expect(buildUserFilters({ search: 'abdu' })).toEqual([
      { field: 'lastName', operator: 'lk', value: 'abdu' },
    ])
  })

  it('routes an all-digits search to a contains filter on pinfl', () => {
    expect(buildUserFilters({ search: '3161' })).toEqual([
      { field: 'pinfl', operator: 'lk', value: '3161' },
    ])
  })

  it('ignores a search shorter than the minimum', () => {
    expect(buildUserFilters({ search: 'a' })).toEqual([])
    expect(buildUserFilters({ search: '  ' })).toEqual([])
  })

  it('combines exact-match filters with the search', () => {
    expect(buildUserFilters({ state: 'ACTIVE', search: 'ivanov' })).toEqual([
      { field: 'state', operator: 'eq', value: 'ACTIVE' },
      { field: 'lastName', operator: 'lk', value: 'ivanov' },
    ])
  })
})
