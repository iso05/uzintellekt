import { requestJson } from '@shared/api'
import { resolveLocalizedName } from '@shared/lib/localized-name'

// "Get all" dictionary endpoints may return a bare array or an object wrapping a
// list — normalize to a plain array so callers don't have to guess.
function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.content)) return data.content
  return data ? [data] : []
}

export async function getWorkTypes() {
  return toArray(await requestJson('/api/v1/dictionaries/work-types'))
}

export async function getAuthorRoles() {
  return toArray(await requestJson('/api/v1/dictionaries/author-roles'))
}

// Pick the label for the active UI language from a dictionary entry's
// LocalizedName { uz, ru, en }. Delegates to the shared resolver so the default
// uz-Cyrl UI transliterates the Latin `uz` value (backend ships no Cyrillic),
// matching the dashboard app. `lang` is accepted for call-site compatibility;
// the resolver reads the live language from the shared i18n instance.
export function localizedName(entry) {
  return resolveLocalizedName(entry?.localizedName, entry?.name || String(entry?.id ?? ''))
}
