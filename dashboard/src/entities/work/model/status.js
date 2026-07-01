export const WORK_STATUS = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REJECTED: 'REJECTED',
  REGISTERED: 'REGISTERED',
}

// Maps backend state to a Badge variant (matches @/shared/ui Badge).
// Labels are resolved via i18n (work_status.*) at render time, not here.
export const WORK_STATUS_CONFIG = {
  DRAFT: { variant: 'muted' },
  UNDER_REVIEW: { variant: 'warning' },
  REJECTED: { variant: 'destructive' },
  REGISTERED: { variant: 'success' },
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

// Soft-delete is allowed only for not-yet-reviewed works (DRAFT/REJECTED).
export function isDeletableState(status) {
  return status === WORK_STATUS.DRAFT || status === WORK_STATUS.REJECTED
}
