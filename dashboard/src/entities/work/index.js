export {
  getWorks,
  getWork,
  createWork,
  updateWork,
  submitWork,
  cancelWork,
  getMyContributions,
  getWorkTypes,
  getAuthorRoles,
} from './api'

export {
  WORK_STATUS,
  WORK_STATUS_CONFIG,
  getWorkStatus,
  getStatusConfig,
  isEditableState,
  isCancellableState,
} from './model/status'

export { getWorksStats, getRecentWorks } from './model/use-cases'
export {
  useDictionaries,
  resolveWorkTypeName,
  resolveAuthorRoleNames,
} from './model/use-dictionaries'

export { default as StatusBadge } from './ui/StatusBadge'
export { default as WorkTypeBadge } from './ui/WorkTypeBadge'
export { default as WorkDetailDialog } from './ui/WorkDetailDialog'
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
} from './model/validation'

export { useWorkForm } from './model/use-work-form'
