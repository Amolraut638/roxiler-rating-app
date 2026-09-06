import api from './axios'

// ── Store Owner endpoints ──────────────────────────────────────────────────────
// GET /api/owner/dashboard
// Authorization: Bearer <token>  (STORE_OWNER role enforced by authorizeRoles middleware)
// ownerId is read exclusively from JWT by the backend — never passed as a client param.
//
// Optional sort params:
//   sortBy:    name | averageRating | ratingCount | createdAt  (default: name)
//   sortOrder: asc | desc                                      (default: asc)

export const getDashboard = (params) => api.get('/owner/dashboard', { params })
