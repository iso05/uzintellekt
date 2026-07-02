export const CONTRACT_TYPES = ['MEMBERSHIP', 'LICENSE']
export const CONTRACT_STATES = ['CREATED', 'PENDING', 'TERMINATED']

const CONTRACT_STATE_CONFIG = {
  CREATED: { variant: 'success' },
  PENDING: { variant: 'warning' },
  TERMINATED: { variant: 'muted' },
}

const CONTRACT_TYPE_CONFIG = {
  MEMBERSHIP: { variant: 'info' },
  LICENSE: { variant: 'secondary' },
}

export function getContractStateConfig(state) {
  return CONTRACT_STATE_CONFIG[state] || { variant: 'muted' }
}

export function getContractTypeConfig(type) {
  return CONTRACT_TYPE_CONFIG[type] || { variant: 'muted' }
}
