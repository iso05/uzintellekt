import { describe, it, expect } from 'vitest'
import { buildUserFilters, filterUsersByType, getGridUserType } from './use-users'

describe('buildUserFilters', () => {
  it('returns no filters when nothing is set', () => {
    expect(buildUserFilters({})).toEqual([])
  })

  it('includes state and subjectType filters in the server grid request', () => {
    expect(buildUserFilters({ state: 'BLOCKED', type: 'LEGAL' })).toEqual([
      { field: 'state', operator: 'eq', value: 'BLOCKED' },
      { field: 'subjectType', operator: 'eq', value: 'LEGAL' },
    ])
  })

  it('maps admin and moderator selections to the role field', () => {
    expect(buildUserFilters({ role: 'ADMIN' })).toEqual([
      { field: 'role', operator: 'eq', value: 'ADMIN' },
    ])
    expect(buildUserFilters({ role: 'MODERATOR' })).toEqual([
      { field: 'role', operator: 'eq', value: 'MODERATOR' },
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
    expect(buildUserFilters({ state: 'ACTIVE', type: 'INDIVIDUAL', search: 'ivanov' })).toEqual([
      { field: 'state', operator: 'eq', value: 'ACTIVE' },
      { field: 'subjectType', operator: 'eq', value: 'INDIVIDUAL' },
      { field: 'lastName', operator: 'lk', value: 'ivanov' },
    ])
  })
})

describe('filterUsersByType', () => {
  it('keeps only organization records for the legal filter', () => {
    const users = [
      { id: 'person', type: 'INDIVIDUAL', firstName: 'Ali' },
      { id: 'company', type: 'LEGAL', legalName: 'IT GROUP MChJ' },
    ]
    expect(filterUsersByType(users, 'LEGAL')).toEqual([users[1]])
  })

  it('treats a record as legal when any API type alias says LEGAL', () => {
    expect(getGridUserType({ type: 'INDIVIDUAL', subjectType: 'LEGAL' })).toBe('LEGAL')
  })

  it('identifies legal entity by legalName or INN when type is omitted', () => {
    expect(getGridUserType({ legalName: 'UZINTELLEKT MCHJ' })).toBe('LEGAL')
    expect(getGridUserType({ inn: '123456789' })).toBe('LEGAL')
  })

  it('identifies individual by pinfl or name when type is omitted', () => {
    expect(getGridUserType({ pinfl: '30101990123450', firstName: 'Ali' })).toBe('INDIVIDUAL')
  })
})
