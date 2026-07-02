// Maps a backend { errorCode } (thrown by request() as err.apiError) to a
// localized, user-friendly message. Falls back to the raw message, then a key.
const CODE_KEYS = {
  1015: 'errors.quota_exceeded', // storage quota exceeded
  1020: 'errors.rate_limit', // too many init/confirm ops (HTTP 429)
  1021: 'errors.draft_limit', // more than 3 active drafts
  1022: 'errors.submit_no_file', // submit without an uploaded file
}

export function apiErrorMessage(err, t, fallbackKey) {
  const code = err?.apiError?.errorCode
  const key = code != null ? CODE_KEYS[code] : null
  if (key) return t(key)
  return err?.message || (fallbackKey ? t(fallbackKey) : t('common.error'))
}
