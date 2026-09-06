import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ label, id, error, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
          <Lock size={16} />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-full border py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
