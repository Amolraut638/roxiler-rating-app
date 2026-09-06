import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, UserRound, ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  USER: 'Normal User',
  STORE_OWNER: 'Store Owner',
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = () => {
    setDropdownOpen(false)
    navigate('/change-password')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: hamburger (mobile only) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
        aria-label="Open menu"
        id="topbar-menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer on desktop so profile is right-aligned */}
      <div className="flex-1" />

      {/* Right: user profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id="topbar-profile"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm"
        >
          <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <UserRound size={15} />
          </span>
          <span className="hidden sm:block">
            <span className="font-medium text-gray-900 max-w-[120px] truncate block leading-tight">
              {user?.name}
            </span>
            <span className="text-xs text-gray-400 block leading-tight">
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
            {/* User info header */}
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              id="topbar-change-password"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <KeyRound size={15} className="text-gray-400" />
              Change Password
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                id="topbar-logout"
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
