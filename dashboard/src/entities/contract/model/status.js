export const CONTRACT_STATUS = {
  CREATED: 'CREATED',
  SIGNED: 'SIGNED',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
}

export const CONTRACT_TYPE_LABELS = {
  MEMBERSHIP: "A'zolik shartnomasi",
  LICENSE: 'Litsenziya shartnomasi',
}

// Maps backend status → UI presentation (label + Badge variant)
export const CONTRACT_STATUS_CONFIG = {
  CREATED: { label: 'Yaratilgan', variant: 'info' },
  SIGNED: { label: 'Imzolangan', variant: 'success' },
  ACTIVE: { label: 'Faol', variant: 'default' },
  EXPIRED: { label: "Muddati o'tgan", variant: 'warning' },
  PENDING: { label: 'Kutilmoqda', variant: 'warning' },
  CANCELLED: { label: 'Bekor', variant: 'muted' },
}

export function getContractStatus(contract) {
  return contract?.status || contract?.state || CONTRACT_STATUS.SIGNED
}

export function getContractStatusConfig(status) {
  return CONTRACT_STATUS_CONFIG[status] || { label: status || "Noma'lum", variant: 'muted' }
}

export function getContractTypeLabel(contract) {
  return CONTRACT_TYPE_LABELS[contract?.type] || CONTRACT_TYPE_LABELS.MEMBERSHIP
}
