/**
 * Validation errors are stored as i18n descriptors ({ key, params }) rather than
 * already-resolved strings, so they re-translate when the UI language changes
 * (an error shown in Cyrillic switches to Latin live, without re-validating).
 *
 * - null/undefined → null (no error)
 * - plain string → returned as-is (e.g. a backend message already localised)
 * - { key, params } → t(key, params); a param value that is itself a descriptor
 *   ({ key }) is translated first, used for field labels in
 *   "{{field}} kiritilishi shart".
 */
export function resolveValidationError(t, error) {
  if (error == null) return null
  if (typeof error === 'string') return error
  const { key, params } = error
  if (!key) return ''

  let interpolation
  if (params) {
    interpolation = {}
    for (const [name, value] of Object.entries(params)) {
      interpolation[name] =
        value && typeof value === 'object' && 'key' in value ? t(value.key) : value
    }
  }
  return t(key, interpolation)
}
