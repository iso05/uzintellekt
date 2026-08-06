export const CONTRACT_STATUS = {
  CREATED: 'CREATED',
  SIGNED: 'SIGNED',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  CREATED: 'CREATED',
}

// Maps backend status → a Badge variant. Labels are resolved via i18n
// (contracts.status.*) at render time, not here.
export const CONTRACT_STATUS_CONFIG = {
  CREATED: { variant: 'success' },
  SIGNED: { variant: 'success' },
  ACTIVE: { variant: 'default' },
  EXPIRED: { variant: 'warning' },
  PENDING: { variant: 'warning' },
  CANCELLED: { variant: 'muted' },
}

export function getContractStatus(contract) {
  return contract?.status || contract?.state || CONTRACT_STATUS.SIGNED
}

export function getContractStatusConfig(status) {
  return CONTRACT_STATUS_CONFIG[status] || { variant: 'muted' }
}
