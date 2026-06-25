import { requestJson } from '@/shared/api'
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

  // Send only the field(s) being changed. A full read-modify-write (GET the
  // whole user, rebuild every field, PATCH it all back) silently reverts a
  // concurrent edit to another field made from a fresher snapshot.
  const payload =
    field === 'pseudonym' || field === 'pseudoname'
      ? { pseudonym: value || null, pseudoname: value || null } // backend aliases both
      : { [field]: value }
  return updateMe(payload)
}
