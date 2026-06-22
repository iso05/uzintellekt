import api from './api'

/**
 * POST /api/v1/auth/login
 * Returns { token, refreshToken, expiresIn, refreshExpiresIn }
 */
export const loginRequest = (username, password) => {
  return api
    .post('/api/v1/auth/login', { username, password })
    .then((res) => {
      return res
    })
    .catch((err) => {
      console.error('[LOGIN] Error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      })
      throw err
    })
}

/**
 * POST /api/v1/auth/token/refresh
 * Returns { token, refreshToken, expiresIn, refreshExpiresIn }
 */
export const refreshTokenRequest = (refreshToken) =>
  api.post('/api/v1/auth/token/refresh', { refreshToken })

/**
 * GET /api/v1/users/me
 * Returns UserInfoResponse — includes isMember, firstName, etc.
 */
export const getMeRequest = () => api.get('/api/v1/users/me')
