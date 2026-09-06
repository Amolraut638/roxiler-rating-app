import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, Mail, MapPin, UserRound, RefreshCw } from 'lucide-react'
import { getUsers, createStore } from '../../api/admin'

// ── Validation constants — mirror adminValidator.js exactly ───────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL_FORM = { name: '', email: '', address: '', ownerId: '' }

// ── Shared field wrapper ──────────────────────────────────────────────────────

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
  [
    'w-full rounded-full border py-2.5 text-sm text-gray-900',
    'placeholder-gray-400 outline-none transition',
    'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
    hasIcon ? 'pl-9 pr-4' : 'px-4',
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-gray-300',
  ].join(' ')

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAddStore() {
  const navigate = useNavigate()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm]           = useState(INITIAL_FORM)
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  // ── Store Owner selection state ─────────────────────────────────────────────
  const [owners, setOwners]       = useState([])
  const [ownersLoading, setOwnersLoading] = useState(true)
  const [ownersError, setOwnersError]     = useState('')

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  // ── Load STORE_OWNER accounts via existing GET /api/admin/users ────────────
  // Pass role=STORE_OWNER and a high limit so we load all in one shot.
  // No new endpoint is created — this reuses the existing listing API.

  const loadOwners = async () => {
    setOwnersLoading(true)
    setOwnersError('')
    try {
      const res = await getUsers({ role: 'STORE_OWNER', limit: 100, sortBy: 'name', sortOrder: 'asc' })
      setOwners(res.data.data.users)
    } catch (err) {
      setOwnersError(
        err.response?.data?.message ?? 'Failed to load store owners. Please try again.'
      )
    } finally {
      setOwnersLoading(false)
    }
  }

  useEffect(() => { loadOwners() }, [])

  // ── Validation — mirrors adminValidator.js exactly ─────────────────────────

  const validate = () => {
    const e = {}

    if (!form.name.trim())
      e.name = 'Store name is required.'
    else if (form.name.trim().length < 20)
      e.name = 'Store name must be at least 20 characters.'
    else if (form.name.trim().length > 60)
      e.name = 'Store name must not exceed 60 characters.'

    if (!form.email)
      e.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email))
      e.email = 'Enter a valid email address.'

    if (!form.address.trim())
      e.address = 'Address is required.'
    else if (form.address.trim().length > 400)
      e.address = 'Address must not exceed 400 characters.'

    if (!form.ownerId)
      e.ownerId = 'Store Owner is required.'

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
      // Send exactly the 4 fields the backend expects — nothing more
      await createStore({
        name:    form.name.trim(),
        email:   form.email,
        address: form.address.trim(),
        ownerId: form.ownerId,
      })
      setSuccess(true)
    } catch (err) {
      const errsArray = err.response?.data?.errors
      const msg = errsArray?.length
        ? errsArray[0]
        : (err.response?.data?.message ?? 'Failed to create store. Please try again.')
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Back button ────────────────────────────────────────────────────────────

  const backBtn = (
    <button
      type="button"
      id="add-store-back"
      onClick={() => navigate('/admin/stores')}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
    >
      <ArrowLeft size={15} />
      Back to Stores
    </button>
  )

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10">
        {backBtn}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Store created!</h2>
          <p className="mt-1 text-sm text-gray-500">
            The new store has been created and assigned successfully.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="add-store-success-back"
              type="button"
              onClick={() => navigate('/admin/stores')}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 transition"
            >
              Back to Stores
            </button>
            <button
              id="add-store-success-another"
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
      {backBtn}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Add Store</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Create a new store and assign it to a Store Owner.
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
          <FormField label="Store Name" id="add-store-name" icon={Store} error={errors.name}>
            <input
              id="add-store-name"
              type="text"
              placeholder="Store name (20–60 characters)"
              value={form.name}
              onChange={set('name')}
              className={inputCls(errors.name)}
            />
          </FormField>

          {/* Email */}
          <FormField label="Store Email" id="add-store-email" icon={Mail} error={errors.email}>
            <input
              id="add-store-email"
              type="email"
              placeholder="store@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              className={inputCls(errors.email)}
            />
          </FormField>

          {/* Address */}
          <FormField label="Address" id="add-store-address" icon={MapPin} error={errors.address}>
            <input
              id="add-store-address"
              type="text"
              placeholder="Store address (max 400 characters)"
              value={form.address}
              onChange={set('address')}
              className={inputCls(errors.address)}
            />
          </FormField>

          {/* Store Owner — select from existing STORE_OWNER accounts */}
          <div>
            <label htmlFor="add-store-owner" className="block text-sm font-medium text-gray-700 mb-1">
              Store Owner
            </label>

            {ownersLoading ? (
              /* Loading owners skeleton */
              <div className="animate-pulse h-10 rounded-full bg-gray-100 w-full" />
            ) : ownersError ? (
              /* Owner load error */
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-red-600">{ownersError}</p>
                <button
                  type="button"
                  onClick={loadOwners}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 shrink-0 transition"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            ) : owners.length === 0 ? (
              /* No store owners exist */
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">No Store Owner accounts found.</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Create a user with the Store Owner role first, then add the store.
                </p>
              </div>
            ) : (
              /* Owner select */
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <UserRound size={16} />
                </span>
                <select
                  id="add-store-owner"
                  value={form.ownerId}
                  onChange={set('ownerId')}
                  className={inputCls(errors.ownerId) + ' bg-white'}
                >
                  <option value="">Select a Store Owner…</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} — {owner.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {errors.ownerId && (
              <p className="mt-1 text-xs text-red-500">{errors.ownerId}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="add-store-submit"
            type="submit"
            disabled={loading || ownersLoading || owners.length === 0}
            className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating…' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  )
}
