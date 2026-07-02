// Validators return i18n error *descriptors* ({ key, params }) — not resolved
// strings — so the message re-translates on language switch. Render them through
// FieldError / resolveValidationError. A field label is passed as an i18n key
// and travels in params.field as a nested descriptor.

export const validatePassport = (value) => {
  if (!value || value.trim() === '') return { key: 'validation.passport_required' }
  if (!/^[A-Z]{2}\d{7}$/.test(value)) return { key: 'validation.passport_format' }
  return null
}

export const validateName = (value, fieldKey = 'validation.field_default') => {
  if (!value || value.trim() === '')
    return { key: 'validation.field_required', params: { field: { key: fieldKey } } }
  return null
}

export const validatePhone = (value) => {
  if (!value || value === '') return { key: 'validation.phone_required' }
  if (!value.startsWith('998')) return { key: 'validation.phone_998' }
  if (value.length < 12) return { key: 'validation.phone_incomplete' }
  if (!/^998\d{9}$/.test(value)) return { key: 'validation.phone_format' }
  return null
}

export const validateShare = (value) => {
  if (value === '' || value === null || value === undefined) return { key: 'validation.share_required' }
  const num = parseFloat(value)
  if (isNaN(num)) return { key: 'validation.share_number' }
  if (num < 0.01) return { key: 'validation.share_min' }
  if (num > 100) return { key: 'validation.share_over' }
  return null
}

export const validateRequired = (value, fieldKey = 'validation.field_default') => {
  if (!value || String(value).trim() === '')
    return { key: 'validation.field_required', params: { field: { key: fieldKey } } }
  return null
}

export const validateShareTotal = (holders) => {
  const total = holders.reduce(
    (sum, h) => sum + (parseFloat(h.sharePercentage || h.share) || 0),
    0
  )
  const rounded = Math.round(total * 100) / 100
  if (rounded !== 100) return { key: 'validation.share_total', params: { n: rounded } }
  return null
}
