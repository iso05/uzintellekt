export function isAdmin(user) {
  return user?.role === 'ADMIN'
}

export function isBlocked(user) {
  return user?.state === 'BLOCKED'
}

export function getFullName(user) {
  if (!user) return ''
  const typeValues = [user.subjectType, user.type, user.userType]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase().trim())
  const isLegal = typeValues.includes('LEGAL') || typeValues.includes('YURIDIK') || (!typeValues.length && Boolean(user.legalName))
  if (isLegal && user.legalName) return user.legalName
  const name = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ').trim()
  return name || user.legalName || user.username || ''
}

export function getInitials(user) {
  const first = (user?.firstName || '').trim()
  const last = (user?.lastName || '').trim()
  const letters = `${first[0] || ''}${last[0] || ''}`.toUpperCase()
  if (letters) return letters
  const source = user?.legalName || user?.username || 'A'
  return source.slice(0, 2).toUpperCase()
}
