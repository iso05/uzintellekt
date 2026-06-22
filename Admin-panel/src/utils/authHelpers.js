/* Auth utilities for mapUser, capitalize, and token helpers */

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function mapUser(data) {
  const fullName = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .map((s) => capitalize(s))
    .join(' ')

  return {
    id: data.id,
    name: data.legalName
      ? data.legalName
      : fullName || data.username || 'Admin',
    role: data.userType === 'LEGAL' ? 'Legal Entity' : 'Individual',
    isMember: data.isMember,
    userType: data.userType,
    pinfl: data.pinfl,
    inn: data.inn,
    phones: data.phones ?? [],
    raw: data,
  }
}
