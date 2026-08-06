import {
  validatePassport,
  validatePinfl,
  validateLatinName,
  validateShare,
  validateRequired,
} from '@shared/lib/validators'

export const EMPTY_HOLDER = {
  type: 'INDIVIDUAL', // 'INDIVIDUAL' | 'LEGAL'
  subjectType: 'INDIVIDUAL',
  rightHolderType: 'AUTHOR', // 'AUTHOR' | 'HEIR' | 'OTHER'
  ownerType: 'AUTHOR',
  passportNo: '',
  firstName: '',
  lastName: '',
  share: '',
  authorRoleIds: ['1'],
  contractFiles: [],
}

export function buildHolderErrorKey(idx, field) {
  // Backend uses sharePercentage/authorRoles; map UI keys accordingly
  const apiKey =
    field === 'share' ? 'sharePercentage' : field === 'authorRoleIds' ? 'authorRoles' : field
  return `rightHolders[${idx}].${apiKey}`
}

export function validateHolder(rh, idx) {
  const errors = {}
  const isLegal = rh.type === 'LEGAL' || rh.subjectType === 'LEGAL'

  if (isLegal) {
    if (!rh.passportNo || rh.passportNo.trim() === '') {
      errors[buildHolderErrorKey(idx, 'passportNo')] = { key: 'validation.inn_required' }
    } else if (!/^\d{9}$/.test(rh.passportNo.trim())) {
      errors[buildHolderErrorKey(idx, 'passportNo')] = { key: 'validation.inn_format' }
    }

    if (!rh.firstName || rh.firstName.trim() === '') {
      errors[buildHolderErrorKey(idx, 'firstName')] = { key: 'validation.org_name_required' }
    }
  } else {
    const pinflErr = validatePinfl(rh.passportNo)
    if (pinflErr) errors[buildHolderErrorKey(idx, 'passportNo')] = pinflErr

    const fnErr = validateLatinName(rh.firstName, 'validation.field_first_name')
    if (fnErr) errors[buildHolderErrorKey(idx, 'firstName')] = fnErr

    const lnErr = validateLatinName(rh.lastName, 'validation.field_last_name')
    if (lnErr) errors[buildHolderErrorKey(idx, 'lastName')] = lnErr
  }

  const shareErr = validateShare(rh.share, idx === 0)
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
  if (Math.abs(total - 100) > 0.02) return { key: 'validation.share_total_simple' }
  return null
}

/** Builds the backend payload from the UI form state. */
export function toPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    workTypeId: Number(form.workTypeId),
    rightHolders: form.rightHolders.map((rh) => {
      const isLegal = rh.type === 'LEGAL' || rh.subjectType === 'LEGAL'
      const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
      const roles = (rh.authorRoleIds || rh.authorRoles || ['1']).map(Number)
      const pNo = (rh.passportNo || rh.pinfl || rh.inn || '').trim()

      const payloadItem = {
        passportNo: pNo,
        ownerType: rhType,
        rightHolderType: rhType,
        subjectType: isLegal ? 'LEGAL' : 'INDIVIDUAL',
        sharePercentage: Number(rh.share ?? rh.sharePercentage ?? 0),
        authorRoles: roles.length > 0 ? roles : [1],
        contractFile: rh.contractFiles && rh.contractFiles.length > 0 ? rh.contractFiles[0] : null,
        contractFiles: rh.contractFiles || [],
      }

      if (isLegal) {
        payloadItem.inn = pNo
        payloadItem.legalName = (rh.legalName || rh.firstName || '').trim()
        payloadItem.pinfl = null
        payloadItem.firstName = null
        payloadItem.lastName = null
      } else {
        payloadItem.pinfl = pNo
        payloadItem.firstName = (rh.firstName || '').trim().toUpperCase()
        payloadItem.lastName = (rh.lastName || '').trim().toUpperCase()
        payloadItem.inn = null
        payloadItem.legalName = null
      }

      return payloadItem
    }),
  }
}

/**
 * Reads a right-holder's author-role ids from whatever shape the backend ships
 * them in (`authorRoleIds` / `authorRoles` / `authorRoleId` / `authorRole.id`).
 * Returns ids as strings. Use this anywhere raw backend holders are read so the
 * UI never depends on a single field name.
 */
export function getHolderRoleIds(rh) {
  if (rh?.authorRoleIds?.length) return rh.authorRoleIds.map(String)
  if (rh?.authorRoles?.length) return rh.authorRoles.map(String)
  if (rh?.authorRoleId) return [String(rh.authorRoleId)]
  if (rh?.authorRole?.id) return [String(rh.authorRole.id)]
  return []
}

/** Converts a backend work entity into UI form state. */
export function fromBackend(data) {
  return {
    name: data?.name || '',
    description: data?.description || '',
    workTypeId: data?.workTypeId || data?.workType?.id || '',
    rightHolders:
      data?.rightHolders && data.rightHolders.length > 0
        ? data.rightHolders.map((rh) => {
            const isLegal = rh.subjectType === 'LEGAL' || rh.type === 'LEGAL'
            const roleIds = getHolderRoleIds(rh)
            const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
            const pNo = isLegal ? (rh.inn || rh.passportNo || '') : (rh.pinfl || rh.passportNo || '')
            return {
              id: rh.id,
              userId: rh.userId,
              type: isLegal ? 'LEGAL' : 'INDIVIDUAL',
              subjectType: isLegal ? 'LEGAL' : 'INDIVIDUAL',
              rightHolderType: rhType,
              ownerType: rhType,
              pinfl: rh.pinfl || (isLegal ? '' : pNo),
              inn: rh.inn || (isLegal ? pNo : ''),
              passportNo: pNo,
              legalName: rh.legalName || (isLegal ? rh.firstName || '' : ''),
              firstName: rh.firstName || (isLegal ? rh.legalName || '' : ''),
              lastName: rh.lastName || '',
              share: rh.sharePercentage !== undefined ? String(rh.sharePercentage) : String(rh.share || ''),
              authorRoleIds: roleIds.length > 0 ? roleIds : ['1'],
              contractFiles: rh.contractFiles || (rh.contractFile ? [rh.contractFile] : []),
            }
          })
        : [{ ...EMPTY_HOLDER }],
  }
}


