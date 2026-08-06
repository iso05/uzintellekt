import { requestJson } from '@shared/api'
import i18n from '@/i18n'

export async function getMe() {
  return requestJson('/api/v1/users/me')
}

export async function updateMe(data) {
  return requestJson('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

const ALLOWED_FIELDS = ['address', 'phones', 'pseudonym', 'pseudoname']

export async function updateMeField(field, value) {
  if (!ALLOWED_FIELDS.includes(field))
    throw new Error(i18n.t('validation.field_invalid', { field }))

  if (field === 'phones') {
    const phones = Array.isArray(value) ? value : [value]
    for (const p of phones) {
      if (!/^998\d{9}$/.test(p)) throw new Error(i18n.t('validation.phone_invalid', { phone: p }))
    }
    value = phones
  }
  if (field === 'address' && (!value || !value.trim())) {
    throw new Error(i18n.t('validation.address_required'))
  }

  // The backend's UpdateUserRequest schema requires BOTH `address` and `phones` in PATCH requests.
  // We fetch the latest user profile and merge the updated field to satisfy validation and avoid stale data.
  const currentUser = await getMe()

  const payload = {
    address: field === 'address' ? value : (currentUser.address || ''),
    phones: field === 'phones' ? value : (currentUser.phones || []),
  }

  const newPseudonym =
    field === 'pseudonym' || field === 'pseudoname'
      ? value
      : (currentUser.pseudonym || currentUser.pseudoname)

  if (newPseudonym !== undefined) {
    payload.pseudonym = newPseudonym || null
  }

  return updateMe(payload)
}

