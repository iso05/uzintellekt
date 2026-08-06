export {
  getWorks,
  getWork,
  createWork,
  updateWork,
  submitWork,
  deleteWork,
  getWorksStat,
  getMyContributions,
  acceptConsent,
  rejectConsent,
  withdrawWork,
  getWorkTypes,
  getAuthorRoles,
  getConsentRejectReasons,
} from './api'

export {
  WORK_STATUS,
  WORK_STATUS_CONFIG,
  getWorkStatus,
  getStatusConfig,
  isEditableState,
  isDeletableState,
} from './model/status'

export { getWorksStats, getRecentWorks } from './model/use-cases'
export {
  useDictionaries,
  resolveWorkTypeName,
  resolveAuthorRoleNames,
} from './model/use-dictionaries'

export { default as StatusBadge } from './ui/StatusBadge'
export { default as WorkTypeBadge } from './ui/WorkTypeBadge'
export { default as WorkDetailContent } from './ui/WorkDetailContent'
export { default as AuthorRolesMultiSelect } from './ui/AuthorRolesMultiSelect'

export {
  EMPTY_HOLDER,
  buildHolderErrorKey,
  validateHolder,
  validateWorkForm,
  findDuplicatePassportErrors,
  computeShareTotal,
  getShareTotalError,
  toPayload,
  fromBackend,
  getHolderRoleIds,
} from './model/validation'

export { useWorkForm } from './model/use-work-form'
