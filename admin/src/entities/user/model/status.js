export const USER_STATES = ['CREATED', 'ACTIVE', 'BLOCKED', 'DELETED']
export const USER_ROLES = ['USER', 'MODERATOR', 'ADMIN']

// Maps backend state/role → @shared/ui Badge variant. Labels resolve via i18n.
const USER_STATE_CONFIG = {
  CREATED: { variant: 'info' },
  ACTIVE: { variant: 'success' },
  BLOCKED: { variant: 'destructive' },
  DELETED: { variant: 'muted' },
}

const USER_ROLE_CONFIG = {
  USER: { variant: 'muted' },
  MODERATOR: { variant: 'warning' },
  ADMIN: { variant: 'info' },
}

export function getStateConfig(state) {
  return USER_STATE_CONFIG[state] || { variant: 'muted' }
}

export function getRoleConfig(role) {
  return USER_ROLE_CONFIG[role] || { variant: 'muted' }
}

// Blocking applies to a live account; activation lifts a block (or promotes a
// freshly created one). DELETED is terminal — neither action is offered.
export function canBlock(state) {
  return state === 'ACTIVE' || state === 'CREATED'
}

export function canActivate(state) {
  return state === 'BLOCKED'
}
