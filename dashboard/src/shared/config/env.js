export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.uzintellekt.uz',
  MAIN_SITE_URL: import.meta.env.VITE_MAIN_SITE_URL,
  TEST_MODE: import.meta.env.VITE_TEST_MODE === 'true',
  IS_DEV: import.meta.env.DEV,
}

export function getMainSite() {
  if (ENV.MAIN_SITE_URL) return ENV.MAIN_SITE_URL
  if (window.location.hostname === 'localhost') return 'http://localhost:5173'
  return 'https://uzintellekt.uz'
}
