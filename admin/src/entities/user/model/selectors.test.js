import { describe, it, expect } from 'vitest'
import { isAdmin, isBlocked, getFullName, getInitials } from './selectors'

describe('user selectors', () => {
  it('isAdmin is true only for the ADMIN role', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true)
    expect(isAdmin({ role: 'MODERATOR' })).toBe(false)
    expect(isAdmin({ role: 'USER' })).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })

  it('isBlocked reflects the BLOCKED state', () => {
    expect(isBlocked({ state: 'BLOCKED' })).toBe(true)
    expect(isBlocked({ state: 'ACTIVE' })).toBe(false)
    expect(isBlocked(undefined)).toBe(false)
  })

  it('getFullName joins an individual name, last-first-middle', () => {
    const user = { userType: 'INDIVIDUAL', firstName: 'Ali', lastName: 'Valiev', middleName: 'B.' }
    expect(getFullName(user)).toBe('Valiev Ali B.')
  })

  it('getFullName prefers legalName for a legal entity', () => {
    expect(getFullName({ userType: 'LEGAL', legalName: 'Acme LLC', firstName: 'x' })).toBe('Acme LLC')
  })

  it('recognizes the current API subjectType field', () => {
    expect(getFullName({ subjectType: 'LEGAL', legalName: 'Acme LLC', firstName: 'x' })).toBe('Acme LLC')
  })

  it('getFullName falls back to username when no name parts exist', () => {
    expect(getFullName({ username: 'admin' })).toBe('admin')
    expect(getFullName(null)).toBe('')
  })

  it('getInitials takes first letters of last and first name, uppercased', () => {
    expect(getInitials({ firstName: 'Ali', lastName: 'Valiev' })).toBe('AV')
    expect(getInitials({ username: 'root' })).toBe('RO')
  })
})
