import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RedirectIfAuth, RequireAuth, RequireRole } from './components/routing/Guards'
import AppLayout from './components/layout/AppLayout'

// Auth pages (outside layout)
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ChangePassword from './pages/auth/ChangePassword'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard'
import AdminUsers       from './pages/admin/AdminUsers'
import AdminAddUser     from './pages/admin/AdminAddUser'
import AdminUserDetails from './pages/admin/AdminUserDetails'
import AdminStores      from './pages/admin/AdminStores'
import AdminAddStore    from './pages/admin/AdminAddStore'

// User pages
import UserStores from './pages/user/UserStores'

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      404 — Page not found
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public auth routes ────────────────────────────── */}
          <Route
            path="/login"
            element={<RedirectIfAuth><Login /></RedirectIfAuth>}
          />
          <Route
            path="/signup"
            element={<RedirectIfAuth><Signup /></RedirectIfAuth>}
          />

          {/* ── Authenticated shell (AppLayout wraps via Outlet) ── */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={<RequireRole roles={['ADMIN']}><AdminDashboard /></RequireRole>}
            />
            <Route
              path="/admin/users"
              element={<RequireRole roles={['ADMIN']}><AdminUsers /></RequireRole>}
            />
            <Route
              path="/admin/users/new"
              element={<RequireRole roles={['ADMIN']}><AdminAddUser /></RequireRole>}
            />
            <Route
              path="/admin/users/:id"
              element={<RequireRole roles={['ADMIN']}><AdminUserDetails /></RequireRole>}
            />
            <Route
              path="/admin/stores"
              element={<RequireRole roles={['ADMIN']}><AdminStores /></RequireRole>}
            />
            <Route
              path="/admin/stores/new"
              element={<RequireRole roles={['ADMIN']}><AdminAddStore /></RequireRole>}
            />

            {/* User routes */}
            <Route
              path="/stores"
              element={<RequireRole roles={['USER']}><UserStores /></RequireRole>}
            />

            {/* Owner routes */}
            <Route
              path="/owner/dashboard"
              element={<RequireRole roles={['STORE_OWNER']}><OwnerDashboard /></RequireRole>}
            />

            {/* Phase 5+ routes added here as phases are implemented */}
          </Route>

          {/* ── Authenticated standalone pages (own full-screen card) ── */}
          <Route
            path="/change-password"
            element={<RequireAuth><ChangePassword /></RequireAuth>}
          />

          {/* ── Root redirect ─────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Catch-all ─────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
