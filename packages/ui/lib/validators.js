// Validators return i18n error *descriptors* ({ key, params }) — not resolved
// strings — so the message re-translates on language switch. Render them through
// FieldError / resolveValidationError. A field label is passed as an i18n key
// and travels in params.field as a nested descriptor.

export const validatePassport = (value) => {
  if (!value || value.trim() === '') return { key: 'validation.passport_required' }
  if (!/^[A-Z]{2}\d{7}$/.test(value)) return { key: 'validation.passport_format' }
  return null
}

export function validateUzPinfl(pinfl) {
  const value = (pinfl || '').trim()

  if (!/^\d+$/.test(value)) {
    return { valid: false, key: 'validation.pinfl_digits_only' }
  }

  if (value.length !== 14) {
    return { valid: false, key: 'validation.pinfl_length' }
  }

  const firstDigit = parseInt(value[0], 10)
  if (firstDigit < 1 || firstDigit > 6) {
    return { valid: false, key: 'validation.pinfl_first_digit' }
  }

  const day = parseInt(value.slice(1, 3), 10)
  const month = parseInt(value.slice(3, 5), 10)
  const yy = parseInt(value.slice(5, 7), 10)

  let century
  if (firstDigit === 1 || firstDigit === 2) century = 1800
  else if (firstDigit === 3 || firstDigit === 4) century = 1900
  else century = 2000

  const fullYear = century + yy

  if (month < 1 || month > 12) {
    return { valid: false, key: 'validation.pinfl_month' }
  }

  const daysInMonth = new Date(fullYear, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    return { valid: false, key: 'validation.pinfl_day' }
  }

  const birthDate = new Date(fullYear, month - 1, day)
  if (birthDate > new Date()) {
    return { valid: false, key: 'validation.pinfl_future' }
  }

  return { valid: true }
}

// PINFL — exactly 14 digits and valid checksum
export const validatePinfl = (value) => {
  if (!value || value.trim() === '') return { key: 'validation.pinfl_required' }
  const res = validateUzPinfl(value.trim())
  if (!res.valid) return { key: res.key }
  return null
}

// Passport seria — 2 capital letters + 7 digits (e.g. AA1234567)
export const validatePassportSeria = (value) => {
  if (!value || value.trim() === '') return null // optional field
  if (!/^[A-Z]{2}\d{7}$/.test(value.trim())) return { key: 'validation.passport_seria_format' }
  return null
}

// Birth date — dd.MM.yyyy, real calendar check
export const validateBirthDate = (value) => {
  if (!value || value.trim() === '') return null // optional field
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value.trim())) return { key: 'validation.birth_date_format' }
  const [day, month, year] = value.split('.').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return { key: 'validation.birth_date_invalid' }
  if (year < 1900 || date > new Date()) return { key: 'validation.birth_date_range' }
  return null
}

export const validateName = (value, fieldKey = 'validation.field_default') => {
  if (!value || value.trim() === '')
    return { key: 'validation.field_required', params: { field: { key: fieldKey } } }
  return null
}

const APOSTROPHES = /[\u2018\u2019\u02BB\u02BC\u0060\u00B4]/g; // ' ' ʻ ʼ ` ´
const DASHES      = /[\u2010-\u2015\u2212]/g;                  // ‐ ‑ ‒ – — ― −

export function normalizePassportName(raw) {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    .trim()
    .replace(APOSTROPHES, "'")
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function isValidPassportName(raw) {
  const n = normalizePassportName(raw);
  return n.length >= 1 && n.length <= 100 && /^[A-Z]+(?:[ '-][A-Z]+)*$/.test(n);
}

// Right-holder names: required + Latin letters only (backend: "Name must contain only Latin letters").
export const validateLatinName = (value, fieldKey = 'validation.field_default') => {
  if (!value || value.trim() === '')
    return { key: 'validation.field_required', params: { field: { key: fieldKey } } }
  if (!isValidPassportName(value))
    return { key: 'validation.latin_only' }
  return null
}

export const validatePhone = (value) => {
  if (!value || value === '') return { key: 'validation.phone_required' }
  if (!value.startsWith('998')) return { key: 'validation.phone_998' }
  if (value.length < 12) return { key: 'validation.phone_incomplete' }
  if (!/^998\d{9}$/.test(value)) return { key: 'validation.phone_format' }
  return null
}

export const validateShare = (value, isPrimary = false) => {
  if (value === '' || value === null || value === undefined) return { key: 'validation.share_required' }
  const num = parseFloat(value)
  if (isNaN(num)) return { key: 'validation.share_number' }
  if (isPrimary && num < 0.01) return { key: 'validation.share_min_primary' }
  if (num < 0) return { key: 'validation.share_min' }
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
