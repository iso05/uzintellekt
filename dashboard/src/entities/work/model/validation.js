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
  if (shareErr) {
    errors[buildHolderErrorKey(idx, 'share')] = shareErr
  } else {
    // 1032: 0% share is only allowed when rightHolderType === 'AUTHOR' && subjectType === 'INDIVIDUAL'
    const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
    const isAuthorIndividual = rhType === 'AUTHOR' && !isLegal
    if (Number(rh.share) === 0 && !isAuthorIndividual) {
      errors[buildHolderErrorKey(idx, 'share')] = { key: 'validation.share_zero_not_allowed', defaultValue: '0% ulush faqat jismoniy muallif uchun ruxsat etilgan' }
    } else if (isLegal && Number(rh.share) < 0.01) {
      errors[buildHolderErrorKey(idx, 'share')] = { key: 'validation.share_min_legal', defaultValue: "Yuridik shaxs ulushi kamida 0.01% bo'lishi shart" }
    }
  }

  if (!rh.authorRoleIds || rh.authorRoleIds.length === 0) {
    errors[buildHolderErrorKey(idx, 'authorRoleIds')] = { key: 'validation.role_required' }
  }

  return errors
}

function _normalizePassport(value) {
  return (value || '').trim().toUpperCase()
}

/** Walks all holders, flags second+ occurrence of the same pinfl/inn/passportNo. */
export function findDuplicatePassportErrors(rightHolders) {
  const errors = {}
  const firstSeenAt = new Map()
  rightHolders.forEach((rh, idx) => {
    const pn = _normalizePassport(rh.pinfl || rh.inn || rh.passportNo)
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

export function getHeirOtherDocErrors(rightHolders) {
  const errors = {}
  rightHolders.forEach((rh, idx) => {
    const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
    if (rhType === 'HEIR' || rhType === 'OTHER') {
      const docCount = (rh.contractFiles?.length || 0) + (rh.pendingFileObjs?.length || 0)
      if (docCount === 0) {
        errors[buildHolderErrorKey(idx, 'contractFiles')] = {
          key: 'validation.heir_doc_required',
          defaultValue: "Voris yoki Boshqa huquq egasi uchun kamida 1 ta tasdiqlovchi hujjat yuklanishi shart",
        }
      }
    }
  })
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

/** Checks if a right holder has sufficient identity fields filled to be sent to backend. Primary holder (index 0) is always valid. Secondary holders must have non-blank name/legalName. */
export function isHolderValidForBackend(rh, idx) {
  if (idx === 0) return true
  const isLegal = rh.type === 'LEGAL' || rh.subjectType === 'LEGAL'
  if (isLegal) {
    return Boolean((rh.legalName || rh.firstName || '').trim())
  }
  return Boolean((rh.firstName || '').trim() || (rh.lastName || '').trim())
}

/** Builds the backend payload from the UI form state. */
export function toPayload(form) {
  const activeHolders = form.rightHolders.filter(isHolderValidForBackend)

  const payload = {
    name: (form.name || '').trim() || 'Qoralama asar',
    description: form.description?.trim() || undefined,
    workTypeId: Number(form.workTypeId) || 1,
    rightHolders: activeHolders.map((rh, idx) => {
      const isLegal = rh.type === 'LEGAL' || rh.subjectType === 'LEGAL'
      const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
      const roles = (rh.authorRoleIds || rh.authorRoles || ['1']).map(Number).filter(Boolean)

      // For LEGAL: inn from inn or passportNo field
      // For INDIVIDUAL: pinfl from pinfl or passportNo field
      // Never send empty string — omit the field entirely so the server
      // doesn't count two blank values as duplicate identifiers.
      const rawPinfl = isLegal ? null : (rh.pinfl || rh.passportNo || '').trim()
      const rawInn   = isLegal ? (rh.inn || rh.passportNo || '').trim() : null

      if (isLegal) {
        return {
          rightHolderType: rhType,
          subjectType: 'LEGAL',
          ...(rawInn ? { inn: rawInn } : {}),
          legalName: (rh.legalName || rh.firstName || '').trim(),
          sharePercentage: Number(rh.share ?? rh.sharePercentage ?? 0),
          authorRoles: roles.length > 0 ? roles : [1],
        }
      }

      const holderPayload = {
        rightHolderType: rhType,
        subjectType: 'INDIVIDUAL',
        firstName: (rh.firstName || '').trim().toUpperCase(),
        lastName: (rh.lastName || '').trim().toUpperCase(),
        sharePercentage: Number(rh.share ?? rh.sharePercentage ?? 0),
        authorRoles: roles.length > 0 ? roles : [1],
      }
      // Only include pinfl when it actually has a value — an empty string
      // sent for multiple holders triggers "Duplicate right holder identifier"
      if (rawPinfl) holderPayload.pinfl = rawPinfl

      return holderPayload
    }),
  }

  console.log(`📦 toPayload [${payload.rightHolders.length} active holders]:`, JSON.stringify(payload, null, 2))
  return payload
}

/**
 * Like toPayload but auto-balances the PRIMARY holder's (index 0) sharePercentage
 * so the total always equals exactly 100. Used ONLY when creating a DRAFT for the
 * sole purpose of obtaining a workId (e.g. before a HEIR/OTHER document upload).
 *
 * Business rule:
 *   - Other holders can have 0% share
 *   - Primary holder gets whatever is left to reach 100%
 *   - Total must be 100% for the server to accept the creation request
 *
 * The real share values in the UI form are NOT touched.
 */
export function toPayloadForDraft(form) {
  const activeHolders = form.rightHolders.filter(isHolderValidForBackend)

  // Deduplicate secondary holders if they share the same PINFL/INN with primary holder or each other
  const seenIdentifiers = new Set()
  const uniqueHolders = activeHolders.filter((rh, idx) => {
    const isLegal = rh.type === 'LEGAL' || rh.subjectType === 'LEGAL'
    const idVal = (isLegal ? (rh.inn || rh.passportNo) : (rh.pinfl || rh.passportNo) || '').trim().toUpperCase()
    if (!idVal) return true
    if (seenIdentifiers.has(idVal)) {
      console.warn(`⚠️ toPayloadForDraft: Skipping duplicate right holder identifier (${idVal}) at index ${idx}`)
      return false
    }
    seenIdentifiers.add(idVal)
    return true
  })

  const others = uniqueHolders.slice(1)
  const othersTotal = Math.round(
    others.reduce((sum, rh) => sum + (Number(rh.share ?? rh.sharePercentage) || 0), 0) * 100
  ) / 100
  const primaryShare = Math.max(0.01, Math.round((100 - othersTotal) * 100) / 100)

  console.log(`📦 toPayloadForDraft: primary share auto-balanced to ${primaryShare}% (others: ${othersTotal}%)`)

  const adjusted = {
    ...form,
    name: (form?.name || '').trim() || 'Qoralama asar',
    workTypeId: Number(form?.workTypeId) || 1,
    rightHolders: uniqueHolders.map((rh, idx) =>
      idx === 0 ? { ...rh, share: String(primaryShare) } : rh
    ),
  }
  return toPayload(adjusted)
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
        ? data.rightHolders.map((rh, idx) => {
            const isLegal = rh.subjectType === 'LEGAL' || rh.type === 'LEGAL'
            const roleIds = getHolderRoleIds(rh)
            const rhType = rh.rightHolderType || rh.ownerType || 'AUTHOR'
            const pNo = isLegal ? (rh.inn || rh.passportNo || '') : (rh.pinfl || rh.passportNo || '')
            let shareStr = rh.sharePercentage !== undefined ? String(rh.sharePercentage) : String(rh.share || '')
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
              share: shareStr,
              authorRoleIds: roleIds.length > 0 ? roleIds : ['1'],
              contractFiles: rh.contractFiles || (rh.contractFile ? [rh.contractFile] : []),
            }
          })
        : [{ ...EMPTY_HOLDER }],
  }
}


