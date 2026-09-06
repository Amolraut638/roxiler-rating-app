import axios from 'axios'

// In local development the Vite dev server proxies /api → http://localhost:5000
// (configured in vite.config.js), so baseURL '/api' works without VITE_API_URL.
//
// In production (Vercel), there is no proxy. VITE_API_URL must be set to the
// full backend URL, e.g. https://roxiler-rating-app-api.vercel.app/api
//
// Set in client/.env.local for local overrides (gitignored).
// Set in Vercel project environment variables for production.

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
