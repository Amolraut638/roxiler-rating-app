import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, UserRound, Mail, MapPin, ShieldCheck,
  Calendar, Store, Star, RefreshCw,
} from 'lucide-react'
import { getUserById } from '../../api/admin'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  ADMIN:       'Administrator',
  USER:        'Normal User',
  STORE_OWNER: 'Store Owner',
}

const ROLE_BADGE_CLS = {
  ADMIN:       'bg-indigo-50 text-indigo-700',
  USER:        'bg-gray-100 text-gray-600',
  STORE_OWNER: 'bg-emerald-50 text-emerald-700',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_CLS[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="mt-0.5 text-gray-400 shrink-0"><Icon size={16} /></span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ── Store card ────────────────────────────────────────────────────────────────

function StoreCard({ store }) {
  const avgRating = store.averageRating
  const hasRatings = store.ratingCount > 0

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{store.name}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <Star size={14} className={hasRatings ? 'text-amber-400' : 'text-gray-300'} fill={hasRatings ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium text-gray-700">
            {hasRatings ? Number(avgRating).toFixed(2) : 'No ratings'}
          </span>
          {hasRatings && (
            <span className="text-xs text-gray-400">({store.ratingCount})</span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Mail size={13} className="text-gray-400 shrink-0" />
          <span className="truncate">{store.email}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
          <span className="break-words">{store.address}</span>
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
              <div className="h-3.5 w-48 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getUserById(id)
      // res.data = { success, message, data: { user } }
      setUser(res.data.data.user)
    } catch (err) {
      setError(
        err.response?.data?.message ??
        'Failed to load user details. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchUser() }, [fetchUser])

  // ── Back button ────────────────────────────────────────────────────────────

  const backBtn = (
    <button
      type="button"
      id="user-details-back"
      onClick={() => navigate('/admin/users')}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
    >
      <ArrowLeft size={15} />
      Back to Users
    </button>
  )

  // ── Error state ────────────────────────────────────────────────────────────

  if (!loading && error) {
    return (
      <div className="max-w-xl mx-auto">
        {backBtn}
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-8 text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              id="user-details-retry"
              type="button"
              onClick={fetchUser}
              className="flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 transition"
            >
              <RefreshCw size={14} />
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2 transition"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto">
      {/* Page heading */}
      <div className="mb-5">
        {backBtn}
        <h1 className="text-xl font-bold text-gray-900">User Details</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Full profile information for this account.
        </p>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* User card */}
      {!loading && user && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {/* Avatar + name header */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <UserRound size={22} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
            </div>

            {/* Detail rows */}
            <InfoRow icon={Mail}       label="Email"   value={user.email} />
            <InfoRow icon={MapPin}     label="Address" value={user.address} />
            <InfoRow icon={ShieldCheck} label="Role"   value={ROLE_LABEL[user.role] ?? user.role} />
            <InfoRow icon={Calendar}   label="Joined"  value={formatDate(user.createdAt)} />
          </div>

          {/* Stores section — only for STORE_OWNER */}
          {user.role === 'STORE_OWNER' && Array.isArray(user.stores) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Store size={16} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  {user.stores.length === 1 ? 'Owned Store' : `Owned Stores (${user.stores.length})`}
                </h2>
              </div>

              {user.stores.length === 0 ? (
                <p className="text-sm text-gray-400">No stores assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {user.stores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
