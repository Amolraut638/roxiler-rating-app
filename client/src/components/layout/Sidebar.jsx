import { NavLink, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS, LOGOUT_ITEM } from '../../config/navConfig'

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_ITEMS[user?.role] ?? []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <span className="text-base font-bold text-gray-900 tracking-tight">Roxiler</span>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 transition p-1 -mr-1 rounded"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom nav (Change Password + Logout) */}
      <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onClick={onClose} />
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          id="sidebar-logout"
        >
          <LOGOUT_ITEM.icon size={18} />
          {LOGOUT_ITEM.label}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-white border-r border-gray-200 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl lg:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
