import {
  validatePassport,
  validateName,
  validateShare,
  validateRequired,
} from '@/shared/lib/validators'

export const EMPTY_HOLDER = {
  passportNo: '',
  firstName: '',
  lastName: '',
  share: '',
  authorRoleIds: [],
}

export function buildHolderErrorKey(idx, field) {
  // Backend uses sharePercentage/authorRoles; map UI keys accordingly
  const apiKey =
    field === 'share' ? 'sharePercentage' : field === 'authorRoleIds' ? 'authorRoles' : field
  return `rightHolders[${idx}].${apiKey}`
}

export function validateHolder(rh, idx) {
  const errors = {}
  const passErr = validatePassport(rh.passportNo)
  if (passErr) errors[buildHolderErrorKey(idx, 'passportNo')] = passErr

  const fnErr = validateName(rh.firstName, 'validation.field_first_name')
  if (fnErr) errors[buildHolderErrorKey(idx, 'firstName')] = fnErr

  const lnErr = validateName(rh.lastName, 'validation.field_last_name')
  if (lnErr) errors[buildHolderErrorKey(idx, 'lastName')] = lnErr

  const shareErr = validateShare(rh.share)
  if (shareErr) errors[buildHolderErrorKey(idx, 'share')] = shareErr

  if (!rh.authorRoleIds || rh.authorRoleIds.length === 0) {
    errors[buildHolderErrorKey(idx, 'authorRoleIds')] = { key: 'validation.role_required' }
  }

  return errors
}

function _normalizePassport(value) {
  return (value || '').trim().toUpperCase()
}

/** Walks all holders, flags second+ occurrence of the same passportNo. */
export function findDuplicatePassportErrors(rightHolders) {
  const errors = {}
  const firstSeenAt = new Map()
  rightHolders.forEach((rh, idx) => {
    const pn = _normalizePassport(rh.passportNo)
    if (!pn) return
    if (firstSeenAt.has(pn)) {
      errors[buildHolderErrorKey(idx, 'passportNo')] = { key: 'validation.passport_dup' }
    } else {
      firstSeenAt.set(pn, idx)
    }
  })
  return errors
}

export function validateWorkForm(form) {
  const errors = {}

  const nameErr = validateRequired(form.name, 'validation.field_work_name')
  if (nameErr) errors.name = nameErr

  if (!form.workTypeId) errors.workTypeId = { key: 'validation.type_required' }

  form.rightHolders.forEach((rh, idx) => {
    Object.assign(errors, validateHolder(rh, idx))
  })

  // Cross-holder uniqueness — must run after per-holder validators so it can
  // override the generic format error with a more specific dup message.
  Object.assign(errors, findDuplicatePassportErrors(form.rightHolders))

  return errors
}

export function computeShareTotal(rightHolders) {
  const sum = rightHolders.reduce((acc, rh) => acc + (Number(rh.share) || 0), 0)
  // Round to 2 decimals so IEEE-754 drift (e.g. 16.10+48.20+35.70 = 100.0000…1)
  // does not reject a total that is mathematically 100%.
  return Math.round(sum * 100) / 100
}

export function getShareTotalError(rightHolders) {
  const total = computeShareTotal(rightHolders)
  if (total !== 100) return { key: 'validation.share_total_simple' }
  return null
}

/** Builds the backend payload from the UI form state. */
export function toPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    workTypeId: Number(form.workTypeId),
    rightHolders: form.rightHolders.map((rh) => ({
      passportNo: rh.passportNo.trim(),
      firstName: rh.firstName.trim(),
      lastName: rh.lastName.trim(),
      sharePercentage: Number(rh.share),
      authorRoles: (rh.authorRoleIds || []).map(Number),
    })),
  }
}

/** Converts a backend work entity into UI form state. */
export function fromBackend(data) {
  return {
    name: data?.name || '',
    description: data?.description || '',
    workTypeId: data?.workTypeId || data?.workType?.id || '',
    rightHolders:
      data?.rightHolders && data.rightHolders.length > 0
        ? data.rightHolders.map((rh) => ({
            passportNo: rh.passportNo || rh.passportSeria || '',
            firstName: rh.firstName || '',
            lastName: rh.lastName || '',
            share: rh.sharePercentage || rh.share || '',
            authorRoleIds:
              rh.authorRoleIds && rh.authorRoleIds.length > 0
                ? rh.authorRoleIds.map(String)
                : rh.authorRoles && rh.authorRoles.length > 0
                  ? rh.authorRoles.map(String)
                  : rh.authorRoleId
                    ? [String(rh.authorRoleId)]
                    : rh.authorRole?.id
                      ? [String(rh.authorRole.id)]
                      : [],
          }))
        : [{ ...EMPTY_HOLDER }],
  }
}
