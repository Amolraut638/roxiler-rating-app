import { useState, useEffect, useCallback } from 'react'
import {
  Store, Star, Users, Mail, MapPin,
  RefreshCw, AlertCircle,
} from 'lucide-react'
import { getDashboard } from '../../api/owner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRating(val) {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Average Rating display ────────────────────────────────────────────────────

function AverageRating({ averageRating, ratingCount }) {
  const n = formatRating(averageRating)

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Star
          size={22}
          className={n !== null ? 'text-amber-400' : 'text-gray-300'}
          fill={n !== null ? 'currentColor' : 'none'}
        />
        <span className={`text-2xl font-bold tabular-nums ${n !== null ? 'text-gray-900' : 'text-gray-400'}`}>
          {n !== null ? n.toFixed(2) : '—'}
        </span>
      </div>
      <span className="text-sm text-gray-500">
        {ratingCount === 0
          ? 'No ratings yet'
          : ratingCount === 1
            ? '1 rating'
            : `${ratingCount} ratings`}
      </span>
    </div>
  )
}

// ── Individual star badge ─────────────────────────────────────────────────────

function StarBadge({ rating }) {
  const n = Number(rating)
  if (isNaN(n)) return <span className="text-gray-400 text-sm">—</span>
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2.5 py-0.5 text-sm font-semibold">
      <Star size={12} fill="currentColor" className="text-amber-400 shrink-0" />
      {n}
    </span>
  )
}

// ── Ratings table for one store ───────────────────────────────────────────────

function RatingsTable({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="py-8 text-center">
        <Users size={28} className="mx-auto text-gray-200 mb-2" />
        <p className="text-sm text-gray-400">No ratings yet for this store.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">User Name</th>
            <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Email</th>
            <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Address</th>
            <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Rating</th>
            <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Rated On</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ratings.map((r, i) => (
            <tr key={r.user?.id ?? i} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">
                {r.user?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                <span className="flex items-center gap-1.5">
                  {r.user?.email && (
                    <Mail size={12} className="text-gray-400 shrink-0" />
                  )}
                  {r.user?.email ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                <span className="flex items-center gap-1.5">
                  {r.user?.address && (
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                  )}
                  {r.user?.address ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <StarBadge rating={r.rating} />
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {formatDate(r.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Store card ────────────────────────────────────────────────────────────────

function StoreCard({ store }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Store header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Store size={16} className="text-indigo-500 shrink-0" />
              <h2 className="text-base font-bold text-gray-900 truncate">{store.name}</h2>
            </div>
            {store.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-gray-400 shrink-0" />
                {store.address}
              </p>
            )}
            {store.email && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Mail size={11} className="text-gray-400 shrink-0" />
                {store.email}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <AverageRating
              averageRating={store.averageRating}
              ratingCount={store.ratingCount}
            />
          </div>
        </div>
      </div>

      {/* Ratings table */}
      <div>
        <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {store.ratingCount === 0
              ? 'Ratings'
              : `Ratings · ${store.ratingCount} ${store.ratingCount === 1 ? 'user' : 'users'}`}
          </p>
        </div>
        <RatingsTable ratings={store.ratings} />
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-8 w-28 bg-gray-100 rounded" />
          </div>
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
          {[...Array(3)].map((_, j) => (
            <div key={j} className="px-4 py-3 flex gap-4 border-b border-gray-50 last:border-0">
              {[...Array(5)].map((_, k) => (
                <div key={k} className="h-3 bg-gray-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const [stores, setStores]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDashboard()
      // res.data = { success, message, data: { stores: [...] } }
      setStores(res.data.data.stores)
    } catch (err) {
      setError(
        err.response?.data?.message ??
        'Failed to load dashboard. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Owner Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Overview of your stores, average ratings, and user feedback.
          </p>
        </div>
        <button
          id="owner-dashboard-refresh"
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
          className="flex items-center gap-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-8 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            id="owner-dashboard-retry"
            type="button"
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 transition mx-auto"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* No stores */}
      {!loading && !error && stores.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-12 text-center">
          <Store size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-600">No stores assigned yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Contact an administrator to have a store assigned to your account.
          </p>
        </div>
      )}

      {/* Store list */}
      {!loading && !error && stores.length > 0 && (
        <div className="space-y-5">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
