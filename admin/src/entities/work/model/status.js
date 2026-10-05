export const WORK_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_CONSENT: 'PENDING_CONSENT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REJECTED: 'REJECTED',
  REGISTERED: 'REGISTERED',
}

// Order used by filters/legends. UNDER_REVIEW first — it is the moderation queue.
export const WORK_STATUS_ORDER = ['UNDER_REVIEW', 'PENDING_CONSENT', 'DRAFT', 'REGISTERED', 'REJECTED']

// Maps backend state → @shared/ui Badge variant. Labels resolve via i18n
// (dashboard.work_status.*) at render time.
const WORK_STATUS_CONFIG = {
  DRAFT: { variant: 'muted' },
  PENDING_CONSENT: { variant: 'warning' },
  UNDER_REVIEW: { variant: 'warning' },
  REJECTED: { variant: 'destructive' },
  REGISTERED: { variant: 'success' },
}

export function getStatusConfig(status) {
  return WORK_STATUS_CONFIG[status] || { variant: 'muted' }
}

// A work can be decided (approved/rejected) only while it is under review.
export function isDecidable(status) {
  return status === WORK_STATUS.UNDER_REVIEW
}

// Admin may edit / (re)submit a work while it is a draft or was rejected.
export function isEditable(status) {
  return status === WORK_STATUS.DRAFT || status === WORK_STATUS.REJECTED
}

// Work-file lifecycle → Badge variant (labels resolve via i18n file_state.*).
const FILE_STATE_CONFIG = {
  PENDING: { variant: 'warning' },
  UPLOADED: { variant: 'success' },
  DELETED: { variant: 'muted' },
  EXPIRED: { variant: 'destructive' },
}

export function getFileStateConfig(state) {
  return FILE_STATE_CONFIG[state] || { variant: 'muted' }
}

// Order used by the files filter dropdown.
export const WORK_FILE_STATES = ['UPLOADED', 'EXPIRED', 'PENDING', 'DELETED']
