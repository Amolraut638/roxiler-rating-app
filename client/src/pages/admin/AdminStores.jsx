import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  RefreshCw, ChevronLeft, ChevronRight,
  Store, Star, Plus,
} from 'lucide-react'
import { getStores } from '../../api/admin'

// ── Constants — match backend validator whitelist exactly ─────────────────────

// Filters: name, email, address (no role filter for stores)
const DEFAULT_FILTERS = { name: '', email: '', address: '' }

// sortBy whitelist from STORE_SORT_FIELDS in adminValidator.js
const SORT_FIELDS = ['name', 'email', 'address', 'averageRating', 'createdAt']

const PAGE_SIZE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

// averageRating comes from Prisma $queryRaw as a Decimal/string — coerce safely
function formatRating(raw) {
  if (raw === null || raw === undefined) return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIcon({ field, sortBy, sortOrder }) {
  if (sortBy !== field) return <ArrowUpDown size={14} className="ml-1 text-gray-300 inline" />
  return sortOrder === 'asc'
    ? <ArrowUp   size={14} className="ml-1 text-indigo-500 inline" />
    : <ArrowDown size={14} className="ml-1 text-indigo-500 inline" />
}

function RatingCell({ averageRating, ratingCount }) {
  const rating = formatRating(averageRating)
  const hasRatings = ratingCount > 0 && rating !== null

  if (!hasRatings) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  return (
    <span className="flex items-center gap-1">
      <Star size={13} className="text-amber-400 shrink-0" fill="currentColor" />
      <span className="text-sm text-gray-900 tabular-nums">{rating.toFixed(2)}</span>
      <span className="text-xs text-gray-400">({ratingCount})</span>
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminStores() {
  // Applied query state — what was last sent to the API
  const [query, setQuery] = useState({
    ...DEFAULT_FILTERS,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: PAGE_SIZE,
  })

  // Draft filter state — what is in the inputs, not yet applied
  const [draft, setDraft] = useState(DEFAULT_FILTERS)

  const [stores, setStores]       = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchStores = useCallback(async (q) => {
    setLoading(true)
    setError('')
    // Strip empty string params so the backend doesn't receive name= etc.
    const params = Object.fromEntries(
      Object.entries(q).filter(([, v]) => v !== '' && v !== undefined)
    )
    try {
      const res = await getStores(params)
      // res.data = { success, message, data: { stores, pagination } }
      setStores(res.data.data.stores)
      setPagination(res.data.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load stores. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStores(query) }, [fetchStores, query])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const applyFilters = () =>
    setQuery((q) => ({ ...q, ...draft, page: 1 }))

  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS)
    setQuery((q) => ({ ...q, ...DEFAULT_FILTERS, page: 1 }))
  }

  const toggleSort = (field) =>
    setQuery((q) => ({
      ...q,
      sortBy: field,
      sortOrder: q.sortBy === field && q.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))

  const goToPage = (p) => setQuery((q) => ({ ...q, page: p }))

  const handleKeyDown = (e) => { if (e.key === 'Enter') applyFilters() }

  // ── Active-filter detection ──────────────────────────────────────────────

  const hasActiveFilters =
    Object.values(draft).some(Boolean) ||
    Object.values({ name: query.name, email: query.email, address: query.address }).some(Boolean)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stores</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All registered stores and their overall ratings.
          </p>
        </div>
        <Link
          to="/admin/stores/new"
          id="add-store-link"
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 transition shrink-0"
        >
          <Plus size={15} />
          Add Store
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            id="filter-store-name"
            type="text"
            placeholder="Filter by name…"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <input
            id="filter-store-email"
            type="text"
            placeholder="Filter by email…"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <input
            id="filter-store-address"
            type="text"
            placeholder="Filter by address…"
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            id="filter-store-apply"
            type="button"
            onClick={applyFilters}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 transition"
          >
            Apply
          </button>
          {hasActiveFilters && (
            <button
              id="filter-store-clear"
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            id="stores-retry"
            type="button"
            onClick={() => fetchStores(query)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 shrink-0 transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Table card */}
      {!error && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    { label: 'Name',           field: 'name'          },
                    { label: 'Email',          field: 'email'         },
                    { label: 'Address',        field: 'address'       },
                    { label: 'Overall Rating', field: 'averageRating' },
                  ].map(({ label, field }) => (
                    <th
                      key={field}
                      onClick={() => SORT_FIELDS.includes(field) && toggleSort(field)}
                      className="px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none whitespace-nowrap hover:text-gray-900 transition-colors"
                    >
                      {label}
                      <SortIcon field={field} sortBy={query.sortBy} sortOrder={query.sortOrder} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? [...Array(PAGE_SIZE)].map((_, i) => <SkeletonRow key={i} />)
                  : stores.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <Store size={36} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400 mb-3">No stores found.</p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="text-sm text-indigo-600 hover:text-indigo-800 transition"
                            >
                              Clear filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                    : stores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate">
                          {store.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                          {store.email}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                          {store.address}
                        </td>
                        <td className="px-4 py-3">
                          <RatingCell
                            averageRating={store.averageRating}
                            ratingCount={store.ratingCount}
                          />
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Page {pagination.page} of {pagination.totalPages}
                &nbsp;·&nbsp;{pagination.total} total
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="stores-page-prev"
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  id="stores-page-next"
                  type="button"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
