import api from './axios'

// ── Normal User store endpoints ───────────────────────────────────────────────
// Filters: name, address (ILIKE contains — backend storeService.js)
// Sort:    name | address | email | createdAt | averageRating
// Pagination: page, limit

export const getStores = (params) => api.get('/stores', { params })

// POST /api/stores/:storeId/rating
// Body: { rating: <integer 1–5> }
// Response 201: { data: { rating: { id, storeId, rating, createdAt } } }
// Error 409: already rated (use updateRating instead)
export const submitRating = (storeId, rating) =>
  api.post(`/stores/${storeId}/rating`, { rating })

// PATCH /api/stores/:storeId/rating
// Body: { rating: <integer 1–5> }
// Response 200: { data: { rating: { id, storeId, rating, createdAt, updatedAt } } }
// Error 404: no existing rating (use submitRating instead)
export const updateRating = (storeId, rating) =>
  api.patch(`/stores/${storeId}/rating`, { rating })
