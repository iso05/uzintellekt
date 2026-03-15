// src/config/oneid.js

export const ONEID_CONFIG = {
  clientId: import.meta.env.VITE_ONEID_CLIENT_ID,
  redirectUri: import.meta.env.VITE_ONEID_REDIRECT_URI, // https://uzintellekt.uz/login
  apiBase: import.meta.env.VITE_API_BASE_URL,           // https://api.uzintellekt.uz

  // OneID rasmiy SSO URL — o'zgartirmang
  authUrl: 'https://sso.egov.uz/sso/oauth/Authorization.do',

  // Backend endpointlar
  endpoints: {
    login:    '/api/auth/oneid/login',
    register: '/api/auth/oneid/register',
    me:       '/api/auth/me',
    logout:   '/api/auth/logout',
  },
}

export const generateState = () => {
  const arr = new Uint32Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => n.toString(16)).join('')
}
