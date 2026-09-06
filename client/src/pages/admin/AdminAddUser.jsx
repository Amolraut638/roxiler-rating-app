import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserRound, Mail, MapPin, ShieldCheck } from 'lucide-react'
import PasswordInput from '../../components/auth/PasswordInput'
import { createUser } from '../../api/admin'

// ── Validation constants — mirror backend adminValidator.js exactly ───────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/
const ROLES = ['USER', 'ADMIN', 'STORE_OWNER']

const ROLE_LABELS = {
  USER:        'Normal User',
  ADMIN:       'Administrator',
  STORE_OWNER: 'Store Owner',
}

const INITIAL_FORM = {
  name: '', email: '', address: '', password: '', confirmPassword: '', role: '',
}

// ── Shared input component (inline — avoids adding a new reusable component) ──

function FormField({ label, id, icon: Icon, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (error, hasIcon = true) =>
  `w-full rounded-full border py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition
   focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
   ${hasIcon ? 'pl-9 pr-4' : 'px-4'}
   ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}`

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAddUser() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  // ── Validation — mirrors adminValidator.js rules exactly ───────────────────

  const validate = () => {
    const e = {}

    if (!form.name.trim())
      e.name = 'Name is required.'
    else if (form.name.trim().length < 20)
      e.name = 'Name must be at least 20 characters.'
    else if (form.name.trim().length > 60)
      e.name = 'Name must not exceed 60 characters.'

    if (!form.email)
      e.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email))
      e.email = 'Enter a valid email address.'

    if (!form.address.trim())
      e.address = 'Address is required.'
    else if (form.address.trim().length > 400)
      e.address = 'Address must not exceed 400 characters.'

    if (!form.password)
      e.password = 'Password is required.'
    else if (!PASSWORD_RE.test(form.password))
      e.password = '8–16 chars, at least one uppercase letter and one special character.'

    if (!form.confirmPassword)
      e.confirmPassword = 'Please confirm the password.'
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'

    if (!form.role)
      e.role = 'Role is required.'
    else if (!ROLES.includes(form.role))
      e.role = 'Select a valid role.'

    return e
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)

    setErrors({})
    setServerError('')
    setLoading(true)

    try {
      // Send only the fields the backend expects — confirmPassword is excluded
      await createUser({
        name:     form.name.trim(),
        email:    form.email,
        address:  form.address.trim(),
        password: form.password,
        role:     form.role,
      })
      setSuccess(true)
    } catch (err) {
      // Surface the first error from the errors[] array (422) or the top-level message
      const errsArray = err.response?.data?.errors
      const msg = errsArray?.length
        ? errsArray[0]
        : (err.response?.data?.message ?? 'Failed to create user. Please try again.')
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <UserRound size={26} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">User created!</h2>
          <p className="mt-1 text-sm text-gray-500">The new account has been created successfully.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="add-user-success-back"
              type="button"
              onClick={() => navigate('/admin/users')}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 transition"
            >
              Back to Users
            </button>
            <button
              id="add-user-success-another"
              type="button"
              onClick={() => { setForm(INITIAL_FORM); setSuccess(false) }}
              className="rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-6 py-2.5 transition"
            >
              Add another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <button
        type="button"
        id="add-user-back"
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
      >
        <ArrowLeft size={15} />
        Back to Users
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Add User</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Create a new account with any role.
          </p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <FormField label="Name" id="add-user-name" icon={UserRound} error={errors.name}>
            <input
              id="add-user-name"
              type="text"
              placeholder="Full name (20–60 characters)"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
              className={inputCls(errors.name)}
            />
          </FormField>

          {/* Email */}
          <FormField label="Email" id="add-user-email" icon={Mail} error={errors.email}>
            <input
              id="add-user-email"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              className={inputCls(errors.email)}
            />
          </FormField>

          {/* Address */}
          <FormField label="Address" id="add-user-address" icon={MapPin} error={errors.address}>
            <input
              id="add-user-address"
              type="text"
              placeholder="Address (max 400 characters)"
              value={form.address}
              onChange={set('address')}
              autoComplete="street-address"
              className={inputCls(errors.address)}
            />
          </FormField>

          {/* Password — reuses existing PasswordInput component */}
          <PasswordInput
            id="add-user-password"
            label="Password"
            placeholder="8–16 chars, uppercase + special char"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <PasswordInput
            id="add-user-confirm-password"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {/* Role */}
          <FormField label="Role" id="add-user-role" icon={ShieldCheck} error={errors.role}>
            <select
              id="add-user-role"
              value={form.role}
              onChange={set('role')}
              className={inputCls(errors.role)}
            >
              <option value="">Select a role…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </FormField>

          {/* Submit */}
          <button
            id="add-user-submit"
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
