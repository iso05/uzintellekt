// src/config/oneid.config.js

export const ONEID_CONFIG = {
  clientId: import.meta.env.VITE_ONEID_CLIENT_ID,
  redirectUri: import.meta.env.VITE_ONEID_REDIRECT_URI,
  apiBase: import.meta.env.VITE_API_BASE_URL,

  // ✅ NEW OneID SSO URL with correct parameters
  authUrl: 'https://sso.egov.uz/sso/oauth/Authorization.do',

  // OneID OAuth 2.0 parameters
  responseType: 'one_code', // ✅ Changed from 'code' to 'one_code'
  scope: 'uzintellekt_uz', // ✅ Added scope parameter

  // Backend endpointlar
  endpoints: {
    login: '/api/auth/oneid/login',
    register: '/api/auth/oneid/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
  },

  // Security config
  STATE_EXPIRY_MS: 10 * 60 * 1000,
  SESSION_KEY_PREFIX: '__uz_sec_',
  CALLBACK_RATE_LIMIT_MS: 5000,
}

/**
 * Kriptografik random state — CSRF himoya
 */
export const generateState = () => {
  const arr = new Uint32Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => n.toString(16)).join('')
}

/**
 * PKCE: Code verifier → Code challenge (OAuth 2.0 best practice for SPAs)
 * https://tools.ietf.org/html/rfc7636
 */
export const generatePKCE = () => {
  const verifier = new Uint8Array(32)
  crypto.getRandomValues(verifier)
  const verifierStr = Array.from(verifier, (x) => String.fromCharCode(x)).join(
    ''
  )
  const verifierB64 = btoa(verifierStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return {
    verifier: verifierB64,
    challenge: generateChallenge(verifierB64),
  }
}

/**
 * PKCE code_challenge = Base64URL(SHA256(code_verifier))
 */
const generateChallenge = async (verifier) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashB64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return hashB64
}

/**
 * Yangi async versiyoni
 */
export const generatePKCEAsync = async () => {
  const verifier = new Uint8Array(32)
  crypto.getRandomValues(verifier)
  const verifierStr = Array.from(verifier, (x) => String.fromCharCode(x)).join(
    ''
  )
  const verifierB64 = btoa(verifierStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const challenge = await generateChallenge(verifierB64)

  return {
    verifier: verifierB64,
    challenge,
  }
}

/**
 * JSON.stringify → JSON.parse orqali malicious payload inject bo'lmasligi uchun
 * ONLY serialize qilish funksiyasi — validation bilan
 */
export const serializeSecure = (data) => {
  try {
    return JSON.stringify(data)
  } catch {
    return null
  }
}

/**
 * Safely parse faqat expected structure uchun
 */
export const parseSecure = (jsonStr, schema) => {
  try {
    const parsed = JSON.parse(jsonStr)

    // Validate struktura — whitelist approach
    if (schema) {
      for (const key of Object.keys(schema)) {
        if (typeof parsed[key] !== schema[key]) {
          throw new Error(`Noto'g'ri field: ${key}`)
        }
      }
    }

    return parsed
  } catch {
    return null
  }
}
