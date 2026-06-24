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

  const fnErr = validateName(rh.firstName, 'Ism')
  if (fnErr) errors[buildHolderErrorKey(idx, 'firstName')] = fnErr

  const lnErr = validateName(rh.lastName, 'Familiya')
  if (lnErr) errors[buildHolderErrorKey(idx, 'lastName')] = lnErr

  const shareErr = validateShare(rh.share)
  if (shareErr) errors[buildHolderErrorKey(idx, 'share')] = shareErr

  if (!rh.authorRoleIds || rh.authorRoleIds.length === 0) {
    errors[buildHolderErrorKey(idx, 'authorRoleIds')] = 'Kamida bitta muallif roli tanlang'
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
      errors[buildHolderErrorKey(idx, 'passportNo')] =
        "Bu pasport allaqachon haq egalari ro'yxatida"
    } else {
      firstSeenAt.set(pn, idx)
    }
  })
  return errors
}

export function validateWorkForm(form) {
  const errors = {}

  const nameErr = validateRequired(form.name, 'Asar nomi')
  if (nameErr) errors.name = nameErr

  if (!form.workTypeId) errors.workTypeId = 'Asar turini tanlang'

  form.rightHolders.forEach((rh, idx) => {
    Object.assign(errors, validateHolder(rh, idx))
  })

  // Cross-holder uniqueness — must run after per-holder validators so it can
  // override the generic format error with a more specific dup message.
  Object.assign(errors, findDuplicatePassportErrors(form.rightHolders))

  return errors
}

export function computeShareTotal(rightHolders) {
  return rightHolders.reduce((sum, rh) => sum + (Number(rh.share) || 0), 0)
}

export function getShareTotalError(rightHolders) {
  const total = computeShareTotal(rightHolders)
  if (total !== 100) return "Haq egalarining jami ulush foizi (%) 100 bo'lishi shart."
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
