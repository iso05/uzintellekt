export const WORK_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  REGISTERED: 'REGISTERED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
}

// Maps backend state to UI presentation: label + badge variant (matches @/shared/ui Badge)
export const WORK_STATUS_CONFIG = {
  DRAFT: { label: 'Qoralama', variant: 'muted' },
  PENDING: { label: "Ko'rib chiqilmoqda", variant: 'warning' },
  REGISTERED: { label: 'Tasdiqlangan', variant: 'success' },
  APPROVED: { label: 'Tasdiqlangan', variant: 'success' },
  REJECTED: { label: 'Rad etilgan', variant: 'destructive' },
  CANCELLED: { label: 'Bekor qilingan', variant: 'muted' },
}

export function getWorkStatus(work) {
  return work?.state || work?.status || WORK_STATUS.DRAFT
}

export function getStatusConfig(status) {
  return (
    WORK_STATUS_CONFIG[status] || { label: status || "Noma'lum", variant: 'muted' }
  )
}

export function isEditableState(status) {
  return status === WORK_STATUS.DRAFT || status === WORK_STATUS.REJECTED
}

export function isCancellableState(status) {
  return status === WORK_STATUS.DRAFT
}
