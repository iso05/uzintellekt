// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE_URL

// ── Token storage ───────────────────────────────────────────────
export const tokenStorage = {
  get:   ()      => localStorage.getItem('access_token'),
  set:   (token) => localStorage.setItem('access_token', token),
  getRefresh: () => localStorage.getItem('refresh_token'),
  setRefresh: (t) => localStorage.setItem('refresh_token', t),
  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.clear()
  },
}

// ── Base request helper ─────────────────────────────────────────
async function request(path, options = {}) {
  const token = tokenStorage.get()

  const headers = {
    ...(options.headers || {}),
  }

  // JSON body bo'lsa Content-Type qo'shish
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  // Bearer token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  // Token muddati tugagan → clear va login ga yo'naltirish
  if (res.status === 401) {
    tokenStorage.clear()
    window.location.href = '/login'
    throw new Error('Sessiya tugadi. Qayta kiring.')
  }

  if (!res.ok) {
    // Backend error response
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.errorMessage || `Server xatosi: ${res.status}`
    )
  }

  return res
}

// ── Auth endpoints ──────────────────────────────────────────────

/**
 * POST /api/v1/auth/sso/one-id
 * Body: { authCode: string }
 * Response: { token, refreshToken, expiresIn, refreshExpiresIn }
 */
export async function loginWithOneIdCode(authCode) {
  const res = await request('/api/v1/auth/sso/one-id', {
    method: 'POST',
    body: JSON.stringify({ authCode }),
  })
  const data = await res.json()

  // Tokenlarni saqlash
  if (data.token)        tokenStorage.set(data.token)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken)

  return data
}

/**
 * POST /api/v1/auth/token/refresh
 * Body: { refreshToken: string }
 * Response: { token, refreshToken, expiresIn, refreshExpiresIn }
 */
export async function refreshToken() {
  const rt = tokenStorage.getRefresh()
  if (!rt) throw new Error('Refresh token topilmadi')

  const res = await request('/api/v1/auth/token/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: rt }),
  })
  const data = await res.json()

  if (data.token)        tokenStorage.set(data.token)
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken)

  return data
}

// ── User endpoints ──────────────────────────────────────────────

/**
 * GET /api/v1/users/me
 * Response: UserInfoResponse { id, firstName, lastName, ..., isMember: boolean }
 */
export async function getMe() {
  const res = await request('/api/v1/users/me')
  return res.json()
}

// ── Contract endpoints ──────────────────────────────────────────

/**
 * POST /api/v1/contracts/preview
 * Body (JSON): PreviewContractRequest { address, phones, contractType, pseudonym? }
 * Response: PDF blob
 */
export async function previewContract(payload) {
  const res = await request('/api/v1/contracts/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.blob()
}

/**
 * POST /api/v1/contracts/sign
 * Body (multipart/form-data):
 *   - request (JSON part): SignContractRequest { address, phones, contractType, pseudonym? }
 *   - signatureImage (binary): PNG file
 * Response: signed PDF blob
 *
 * signatureDataUrl — canvas.toDataURL('image/png') dan kelgan base64 string
 */
export async function signContract(payload, signatureDataUrl) {
  const token = tokenStorage.get()

  // base64 → Blob → File
  const base64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
  const binary  = atob(base64)
  const arr     = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  const imageBlob = new Blob([arr], { type: 'image/png' })
  const imageFile = new File([imageBlob], `signature_${Date.now()}.png`, {
    type: 'image/png',
  })

  // multipart/form-data
  const formData = new FormData()

  // "request" part — Content-Type: application/json (Swagger encoding)
  const requestBlob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  })
  formData.append('request', requestBlob)
  formData.append('signatureImage', imageFile)

  const res = await fetch(`${BASE}/api/v1/contracts/sign`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    // Content-Type header QOLDIRILMAYDI — browser o'zi boundary bilan to'ldiradi
  })

  if (res.status === 401) {
    tokenStorage.clear()
    window.location.href = '/login'
    throw new Error('Sessiya tugadi. Qayta kiring.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errorMessage || `Shartnoma imzolashda xatolik: ${res.status}`)
  }

  return res.blob()
}

// ── Utility helpers ─────────────────────────────────────────────

/**
 * Telefon raqamni backend formatiga keltirish
 * Backend pattern: ^998\d{9}$
 *
 * "+998 90 123 45 67" → "998901234567"
 * "901234567"         → "998901234567"
 * "998901234567"      → "998901234567"
 */
export function normalizePhone(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')

  if (/^998\d{9}$/.test(digits)) return digits          // allaqachon to'g'ri
  if (/^\d{9}$/.test(digits))    return `998${digits}`  // 9 raqamli lokal
  return digits
}

/**
 * Manzil satrini qurish
 * Backend expects string, e.g. "Toshkent viloyati, Yangiyo'l tumani, Mustaqillik ko'chasi, 12A"
 */
export function buildAddress({ regionName, districtName, street, houseNumber }) {
  const parts = [regionName, districtName, street, houseNumber]
    .map((p) => (p || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}
