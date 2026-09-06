import { LayoutDashboard, Users, Store, KeyRound, LogOut } from 'lucide-react'

// Navigation items per role.
// `to` must match an existing route — only routes that actually exist are included.
// Future dashboard/store/admin routes will be added here as phases are implemented.
export const NAV_ITEMS = {
  ADMIN: [
    { label: 'Dashboard',       to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users',           to: '/admin/users',     icon: Users },
    { label: 'Stores',          to: '/admin/stores',    icon: Store },
  ],
  USER: [
    { label: 'Stores',          to: '/stores',          icon: Store },
  ],
  STORE_OWNER: [
    { label: 'Dashboard',       to: '/owner/dashboard', icon: LayoutDashboard },
  ],
}

// Bottom items are the same for every role
export const BOTTOM_NAV_ITEMS = [
  { label: 'Change Password', to: '/change-password', icon: KeyRound },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: LogOut }
