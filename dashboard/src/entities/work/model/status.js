export const WORK_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  REGISTERED: 'REGISTERED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
}

// Maps backend state to a Badge variant (matches @/shared/ui Badge).
// Labels are resolved via i18n (work_status.*) at render time, not here.
export const WORK_STATUS_CONFIG = {
  DRAFT: { variant: 'muted' },
  PENDING: { variant: 'warning' },
  REGISTERED: { variant: 'success' },
  APPROVED: { variant: 'success' },
  REJECTED: { variant: 'destructive' },
  CANCELLED: { variant: 'muted' },
}

export function getWorkStatus(work) {
  return work?.state || work?.status || WORK_STATUS.DRAFT
}

export function getStatusConfig(status) {
  return WORK_STATUS_CONFIG[status] || { variant: 'muted' }
}

export function isEditableState(status) {
  return status === WORK_STATUS.DRAFT || status === WORK_STATUS.REJECTED
}

export function isCancellableState(status) {
  return status === WORK_STATUS.DRAFT
}
