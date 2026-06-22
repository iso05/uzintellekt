import axios from 'axios'

/* ── Token storage helpers ─────────────────────────────────── */
const TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (t, r) => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(REFRESH_TOKEN_KEY, r)
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

/* ── Axios instance ────────────────────────────────────────── */
const BASE = import.meta.env.VITE_API_URL || 'https://api.uzintellekt.uz'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

/* ── Request interceptor — attach Bearer token ─────────────── */
api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  console.debug('[API] Request:', {
    method: config.method.toUpperCase(),
    url: config.url,
    hasToken: !!token,
    hasData: !!config.data,
  })
  return config
})

/* ── Track if we're already refreshing (prevent loops) ─────── */
let isRefreshing = false
let pendingQueue = [] // requests waiting while token refreshes

const processQueue = (error, token = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  pendingQueue = []
}

/* ── Response interceptor — auto-refresh on 401 ────────────── */
api.interceptors.response.use(
  (res) => {
    console.debug('[API] Response OK:', {
      status: res.status,
      url: res.config.url,
    })
    return res
  },
  async (error) => {
    console.error('[API] Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      errorData: error.response?.data,
      message: error.message,
    })

    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefresh()
    if (!refreshToken) {
      tokenStorage.clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue requests that arrived while refresh is in progress
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${BASE}/api/v1/auth/token/refresh`, {
        refreshToken,
      })
      tokenStorage.setTokens(data.token, data.refreshToken)
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`
      processQueue(null, data.token)
      original.headers.Authorization = `Bearer ${data.token}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStorage.clearTokens()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
