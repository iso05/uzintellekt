import { describe, it, expect } from 'vitest'
import { buildContractFilters } from './use-contracts'

describe('buildContractFilters', () => {
  it('returns no filters when nothing is set', () => {
    expect(buildContractFilters({})).toEqual([])
  })

  it('maps type and state to eq filters', () => {
    expect(buildContractFilters({ type: 'MEMBERSHIP', state: 'CREATED' })).toEqual([
      { field: 'type', operator: 'eq', value: 'MEMBERSHIP' },
      { field: 'state', operator: 'eq', value: 'CREATED' },
    ])
  })

  it('maps a trimmed search to a starts-with filter on number', () => {
    expect(buildContractFilters({ search: ' M-000 ' })).toEqual([
      { field: 'number', operator: 'sw', value: 'M-000' },
    ])
  })

  it('ignores a blank search', () => {
    expect(buildContractFilters({ search: '  ' })).toEqual([])
  })
})
