export function getUserFullName(user) {
  if (!user) return ''
  if (user.userType === 'LEGAL') return user.legalName || ''
  return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')
}

export function getUserShortName(user) {
  if (!user) return 'Foydalanuvchi'
  if (user.userType === 'LEGAL') return user.legalName || 'Yuridik Tashkilot'
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Foydalanuvchi'
}

export function getUserInitials(user) {
  if (!user) return '?'
  if (user.userType === 'LEGAL') {
    return (user.legalName?.[0] || '?').toUpperCase()
  }
  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase()
  return initials || '?'
}

export function getUserRoleLabel(user) {
  return user?.userType === 'LEGAL' ? 'Yuridik shaxs' : 'Jismoniy shaxs'
}

export function isBlocked(user) {
  return user?.state === 'BLOCKED' || user?.status === 'BLOCKED'
}
