export const maskName = (value) =>
  value.replace(/[^a-zA-ZА-Яа-яЁёÀ-žʻʼ'\-\s]/g, '')

// Right-holder names must be Latin-only (backend: "Name must contain only Latin letters").
// Uppercases input and strips Cyrillic/digits/symbols except spaces, dashes, and apostrophes.
export const maskLatinName = (value) => {
  const upper = (value || '').toUpperCase()
  return upper.replace(/[^A-Z\s\u2018\u2019\u02BB\u02BC\u0060\u00B4'\u2010-\u2015\u2212-]/g, '')
}

export const maskPseudonym = (value) =>
  value.replace(/[^a-zA-ZА-Яа-яЁёÀ-žʻʼ'\-\s0-9]/g, '')


export const maskPassport = (value) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, '')
  const digits = cleaned
    .slice(letters.length)
    .replace(/[^0-9]/g, '')
    .slice(0, 7)
  return (letters + digits).slice(0, 9)
}

// Passport seria mask: 2 uppercase letters then up to 7 digits (e.g. AA1234567)
export const maskPassportSeria = (value) => {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const letters = upper.replace(/[^A-Z]/g, '').slice(0, 2)
  const digits = upper.slice(letters.length).replace(/[^0-9]/g, '').slice(0, 7)
  return letters + digits
}

export const maskPhone = (value) => {
  const digits = value.replace(/[^0-9]/g, '')
  if (digits.length === 0) return ''
  if (!digits.startsWith('998')) {
    return ('998' + digits).slice(0, 12)
  }
  return digits.slice(0, 12)
}

export const maskShare = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) return parts[0] + '.' + parts[1].slice(0, 2)
  if (parts[1]?.length > 2) return parts[0] + '.' + parts[1].slice(0, 2)
  if (parseFloat(cleaned) > 100) return '100'
  return cleaned
}

export const maskDigitsOnly = (value) => value.replace(/[^0-9]/g, '')

export const maskUzPinfl = (value) => (value || '').replace(/\D/g, '').slice(0, 14)
