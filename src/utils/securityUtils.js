/**
 * Frontend Security Utilities for OneID Integration
 * Senior-level security practices
 */

/**
 * Validate redirect URI — prevent open redirect attacks
 * @param {string} url - URL to validate
 * @param {string} allowedOrigin - Expected origin
 * @returns {boolean}
 */
export const isValidRedirectURI = (url, allowedOrigin) => {
  try {
    const parsed = new URL(url)
    const allowed = new URL(allowedOrigin)

    // Protocol va host must match
    if (parsed.protocol !== allowed.protocol) return false
    if (parsed.host !== allowed.host) return false

    return true
  } catch {
    return false
  }
}

/**
 * Sanitize error messages — don't leak backend structure
 * @param {string} error - Error message
 * @returns {string}
 */
export const sanitizeErrorMessage = (error) => {
  const message = String(error || '')

  // Hide sensitive patterns
  const sensitivePatterns = [
    /https?:\/\/[^\s]+/g, // URLs
    /\/api\/[^\s]+/g, // API paths
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, // IP addresses
    /error:\s*\{[^}]*\}/gi, // Error objects
    /code:\s*\d+/gi, // Status codes
  ]

  let sanitized = message
  sensitivePatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[***]')
  })

  // Fallback to generic message if too much was removed
  if (sanitized.length < 5) {
    return "Baribir xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
  }

  return sanitized
}

/**
 * Validate state parameter against stored state
 * Includes timestamp validation to prevent replay
 * @param {string} receivedState - State from URL
 * @param {object} storedState - {state, timestamp}
 * @param {number} maxAge - Max age in milliseconds
 * @returns {boolean}
 */
export const validateStateParam = (
  receivedState,
  storedState,
  maxAge = 10 * 60 * 1000
) => {
  if (!receivedState || !storedState) return false

  // Timing attack resistance — constant-time comparison
  const isStateValid = crypto.subtle
    .timingSafeEqual(
      new TextEncoder().encode(receivedState),
      new TextEncoder().encode(storedState.state)
    )
    .valueOf()

  if (!isStateValid) return false

  // Check expiry
  const age = Date.now() - storedState.timestamp
  if (age > maxAge) return false

  return true
}

/**
 * Sanitize form data before storing — prevent XSS
 * @param {object} formData - Form data object
 * @returns {object}
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {}

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      // Remove potential script tags, event handlers
      sanitized[key] = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value
    } else if (value === null || value === undefined) {
      sanitized[key] = ''
    }
  }

  return sanitized
}

/**
 * Rate limiter — prevent callback spam/replay attacks
 */
export class CallbackRateLimiter {
  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs
    this.lastCallTime = 0
    this.attemptCount = 0
    this.MAX_ATTEMPTS = 3
    this.BLOCK_DURATION_MS = 60000
    this.blockedUntil = 0
  }

  /**
   * Check if callback can be processed
   * @returns {object} {allowed: boolean, reason?: string}
   */
  canProceed() {
    const now = Date.now()

    // Check if blocked
    if (this.blockedUntil > now) {
      return {
        allowed: false,
        reason: "Juda ko'p urinishlar. Biroz kuting...",
        blockedFor: this.blockedUntil - now,
      }
    }

    // Check cooldown
    if (now - this.lastCallTime < this.cooldownMs) {
      this.attemptCount++

      if (this.attemptCount > this.MAX_ATTEMPTS) {
        this.blockedUntil = now + this.BLOCK_DURATION_MS
        return {
          allowed: false,
          reason: "Juda ko'p urinishlar. Biroz kuting...",
        }
      }

      return {
        allowed: false,
        reason: `Iltimos, ${Math.ceil((this.cooldownMs - (now - this.lastCallTime)) / 1000)}s kuting`,
      }
    }

    // Reset counter on success
    this.lastCallTime = now
    this.attemptCount = 0
    return { allowed: true }
  }
}

/**
 * Clear sensitive data from browser history
 * @param {string} cleanUrl - URL to replace history with
 */
export const cleanURLHistory = (cleanUrl = '/') => {
  // Remove query params from history
  window.history.replaceState({}, document.title, cleanUrl)
}

/**
 * Validate code parameter format
 * Prevents injection attacks via malformed codes
 * @param {string} code - Authorization code
 * @returns {boolean}
 */
export const isValidAuthCode = (code) => {
  if (!code || typeof code !== 'string') return false

  // Most auth codes are alphanumeric with some special chars
  // Adjust regex based on OneID's code format
  return (
    /^[a-zA-Z0-9._\-~+/]+$/.test(code) && code.length > 10 && code.length < 1000
  )
}

/**
 * Secure storage — encrypt sensitive data before persistence
 * (Production: use dynamic encryption keys from backend)
 */
export const secureStorage = {
  /**
   * XOR cipher — basic encryption for sessionStorage
   * ⚠️ For production, use proper encryption library + key management
   */
  encryptData(data, key) {
    const jsonStr = JSON.stringify(data)
    const encoded = new TextEncoder().encode(jsonStr)
    const keyBuf = new TextEncoder().encode(key)

    let encrypted = ''
    for (let i = 0; i < encoded.length; i++) {
      encrypted += String.fromCharCode(encoded[i] ^ keyBuf[i % keyBuf.length])
    }

    return btoa(encrypted) // Base64 encode
  },

  decryptData(encryptedStr, key) {
    try {
      const encrypted = atob(encryptedStr)
      const encoded = new TextEncoder().encode(encrypted)
      const keyBuf = new TextEncoder().encode(key)

      let decrypted = ''
      for (let i = 0; i < encoded.length; i++) {
        decrypted += String.fromCharCode(encoded[i] ^ keyBuf[i % keyBuf.length])
      }

      return JSON.parse(decrypted)
    } catch {
      return null
    }
  },
}

/**
 * XSS Prevention — escape HTML entities
 */
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * CSP Header builder — communicate to backend what headers to set
 * Backend should set these headers based on environment
 * @param {string} apiBase - API base URL (e.g., https://api.uzintellekt.uz)
 * @returns {object} Headers object for backend to set
 */
export const getRecommendedSecurityHeaders = (
  apiBase = import.meta.env.VITE_API_BASE_URL
) => {
  const apiDomain = new URL(apiBase).origin

  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Minimize unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      `connect-src 'self' ${apiDomain} https://sso.egov.uz`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }
}

/**
 * Log suspicious activities (frontend security monitoring)
 * Send to backend monitoring service
 */
export const logSecurityEvent = (eventType, details) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.pathname,
    details,
  }

  // Send to your security monitoring backend
  // fetch('/api/security/log', { method: 'POST', body: JSON.stringify(event) })

  // For dev: console warning
  if (import.meta.env.DEV) {
    console.warn('[SECURITY EVENT]', event)
  }
}
