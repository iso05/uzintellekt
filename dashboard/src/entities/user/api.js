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

  const cur = await getMe()
  const payload = {
    address: cur.address,
    phones: cur.phones,
    pseudonym: cur.pseudonym || cur.pseudoname || null,
    pseudoname: cur.pseudonym || cur.pseudoname || null,
  }
  if (field === 'pseudonym' || field === 'pseudoname') {
    payload.pseudonym = value || null
    payload.pseudoname = value || null
  } else {
    payload[field] = value
  }
  return updateMe(payload)
}
