import i18n from '@/i18n'

const t = (key, opts) => i18n.t(key, opts)

export const validatePassport = (value) => {
  if (!value || value.trim() === '') return t('validation.passport_required')
  if (!/^[A-Z]{2}\d{7}$/.test(value)) return t('validation.passport_format')
  return null
}

export const validateName = (value, fieldLabel) => {
  const field = fieldLabel || 'Maydon'
  if (!value || value.trim() === '') return t('validation.field_required', { field })
  return null
}

export const validatePhone = (value) => {
  if (!value || value === '') return t('validation.phone_required')
  if (!value.startsWith('998')) return t('validation.phone_998')
  if (value.length < 12) return t('validation.phone_incomplete')
  if (!/^998\d{9}$/.test(value)) return t('validation.phone_format')
  return null
}

export const validateShare = (value) => {
  if (value === '' || value === null || value === undefined) return t('validation.share_required')
  const num = parseFloat(value)
  if (isNaN(num)) return t('validation.share_number')
  if (num < 0.01) return t('validation.share_min')
  if (num > 100) return t('validation.share_over')
  return null
}

export const validateRequired = (value, label) => {
  const field = label || 'Maydon'
  if (!value || String(value).trim() === '') return t('validation.field_required', { field })
  return null
}

export const validateShareTotal = (holders) => {
  const total = holders.reduce(
    (sum, h) => sum + (parseFloat(h.sharePercentage || h.share) || 0),
    0
  )
  const rounded = Math.round(total * 100) / 100
  if (rounded !== 100) return t('validation.share_total', { n: rounded })
  return null
}
