import { describe, it, expect } from 'vitest'
import { buildFileFilters } from './use-files'

describe('buildFileFilters', () => {
  it('returns no filters when nothing is set', () => {
    expect(buildFileFilters({})).toEqual([])
  })

  it('maps status to an eq filter on state', () => {
    expect(buildFileFilters({ status: 'EXPIRED' })).toEqual([
      { field: 'state', operator: 'eq', value: 'EXPIRED' },
    ])
  })

  it('maps a trimmed search to a starts-with filter on originalFileName', () => {
    expect(buildFileFilters({ search: '  report ' })).toEqual([
      { field: 'originalFileName', operator: 'sw', value: 'report' },
    ])
  })

  it('ignores a blank search', () => {
    expect(buildFileFilters({ search: '   ' })).toEqual([])
  })

  it('combines status and search', () => {
    expect(buildFileFilters({ status: 'UPLOADED', search: 'a' })).toEqual([
      { field: 'state', operator: 'eq', value: 'UPLOADED' },
      { field: 'originalFileName', operator: 'sw', value: 'a' },
    ])
  })
})
