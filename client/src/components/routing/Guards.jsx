import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Redirects to /login if not authenticated
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Redirects authenticated users away from public auth pages
export function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()
  const ROLE_HOME = { ADMIN: '/admin/dashboard', USER: '/stores', STORE_OWNER: '/owner/dashboard' }
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return children
}

// Restricts a route to specific roles
export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}
