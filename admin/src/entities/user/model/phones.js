// Phones travel as a string[] on the wire but are edited as one free-text field.
export function parsePhones(text) {
  return String(text || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function joinPhones(phones) {
  return Array.isArray(phones) ? phones.join(', ') : ''
}
