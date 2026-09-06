export default function AuthInput({ label, id, icon: Icon, error, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          className={`w-full rounded-full border py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
            ${Icon ? 'pl-9 pr-4' : 'px-4'}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
