/**
 * Configuration Validator for OneID Integration
 * Ensures all required environment variables are set at runtime
 */

import { ONEID_CONFIG } from '../config/oneid.config'

/**
 * Validate OneID configuration
 * @throws {Error} If any required config is missing
 */
export const validateOneIDConfig = () => {
  const errors = []

  // Check Client ID
  if (!ONEID_CONFIG.clientId) {
    errors.push('VITE_ONEID_CLIENT_ID is not set')
  }

  // Check Redirect URI
  if (!ONEID_CONFIG.redirectUri) {
    errors.push('VITE_ONEID_REDIRECT_URI is not set')
  } else {
    try {
      new URL(ONEID_CONFIG.redirectUri)
    } catch {
      errors.push(
        `VITE_ONEID_REDIRECT_URI is invalid URL: ${ONEID_CONFIG.redirectUri}`
      )
    }
  }

  // Check API Base
  if (!ONEID_CONFIG.apiBase) {
    errors.push('VITE_API_BASE_URL is not set')
  } else {
    try {
      new URL(ONEID_CONFIG.apiBase)
    } catch {
      errors.push(
        `VITE_API_BASE_URL is invalid URL: ${ONEID_CONFIG.apiBase}`
      )
    }
  }

  // Check Auth URL (should be OneID SSO)
  if (!ONEID_CONFIG.authUrl || !ONEID_CONFIG.authUrl.includes('sso.egov.uz')) {
    errors.push(
      'OneID SSO URL is misconfigured. Must be: https://sso.egov.uz/sso/oauth/Authorization.do'
    )
  }

  // If there are errors, throw
  if (errors.length > 0) {
    throw new Error(`OneID Configuration Invalid: ${errors.join('; ')}`)
  }
}

/**
 * Log configuration details (for debugging)
 * @param {boolean} showSensitive - Show sensitive values (dangerous in production)
 */
export const logConfigDetails = (_showSensitive = false) => {
  // No-op in production — debug logging removed
}

/**
 * Validate redirect URI matches expected domain
 * @param {string} expectedDomain - Expected domain (e.g., dashboard.uzintellekt.uz)
 * @throws {Error} If domain doesn't match
 */
export const validateRedirectDomain = (expectedDomain) => {
  const redirectUrl = new URL(ONEID_CONFIG.redirectUri)
  const expectedUrl = new URL(`https://${expectedDomain}`)

  if (redirectUrl.protocol !== expectedUrl.protocol) {
    throw new Error('Protocol mismatch')
  }

  if (redirectUrl.host !== expectedUrl.host) {
    throw new Error(
      `Domain mismatch: ${redirectUrl.host} !== ${expectedUrl.host}`
    )
  }
}
