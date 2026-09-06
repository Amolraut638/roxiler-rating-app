import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  RefreshCw, ChevronLeft, ChevronRight,
  Store, Star, X,
} from 'lucide-react'
import { getStores, submitRating, updateRating } from '../../api/stores'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = { name: '', address: '' }
const SORT_FIELDS = ['name', 'address', 'email', 'createdAt', 'averageRating']
const PAGE_SIZE   = 10
const STAR_VALUES = [1, 2, 3, 4, 5]

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({ field, sortBy, sortOrder }) {
  if (sortBy !== field)
    return <ArrowUpDown size={14} className="ml-1 text-gray-300 inline" />
  return sortOrder === 'asc'
    ? <ArrowUp   size={14} className="ml-1 text-indigo-500 inline" />
    : <ArrowDown size={14} className="ml-1 text-indigo-500 inline" />
}

// Overall average rating — backend pre-normalises to number|null
function OverallRatingCell({ averageRating }) {
  if (averageRating === null || averageRating === undefined)
    return <span className="text-gray-400 text-sm">—</span>
  const n = Number(averageRating)
  if (isNaN(n)) return <span className="text-gray-400 text-sm">—</span>
  return (
    <span className="flex items-center gap-1">
      <Star size={13} className="text-amber-400 shrink-0" fill="currentColor" />
      <span className="text-sm text-gray-900 tabular-nums">{n.toFixed(2)}</span>
    </span>
  )
}

// ── StarPicker — compact inline star picker ───────────────────────────────────

function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value || 0

  return (
    <span className="flex items-center gap-0.5" role="group" aria-label="Select rating">
      {STAR_VALUES.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => !disabled && setHovered(0)}
          disabled={disabled}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          title={`${n} star${n !== 1 ? 's' : ''}`}
          className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed"
        >
          <Star
            size={18}
            className={n <= active ? 'text-amber-400' : 'text-gray-300'}
            fill={n <= active ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </span>
  )
}

// ── UserRatingCell — per-row stateful rating component ────────────────────────

function UserRatingCell({ storeId, userSubmittedRating, onRatingChange }) {
  const [open, setOpen]           = useState(false)
  const [pending, setPending]     = useState(null)   // star hovered/selected in picker
  const [submitting, setSubmitting] = useState(false)
  const [cellError, setCellError] = useState('')
  const containerRef              = useRef(null)

  const hasRated = userSubmittedRating !== null && userSubmittedRating !== undefined
  const currentRating = hasRated ? Number(userSubmittedRating) : null

  // Close picker when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setPending(null)
        setCellError('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setPending(null)
        setCellError('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const openPicker = () => {
    setPending(currentRating)  // pre-select current rating when modifying
    setCellError('')
    setOpen(true)
  }

  const closePicker = () => {
    setOpen(false)
    setPending(null)
    setCellError('')
  }

  const handleSubmit = async () => {
    if (!pending || submitting) return
    // Backend: rating must be integer 1–5
    if (!Number.isInteger(pending) || pending < 1 || pending > 5) {
      setCellError('Select a rating between 1 and 5.')
      return
    }

    setSubmitting(true)
    setCellError('')

    try {
      if (hasRated) {
        // PATCH /api/stores/:storeId/rating — modify existing
        await updateRating(storeId, pending)
      } else {
        // POST /api/stores/:storeId/rating — new submission
        await submitRating(storeId, pending)
      }
      // Update this row locally — no full page reload
      onRatingChange(storeId, pending)
      closePicker()
    } catch (err) {
      const errs = err.response?.data?.errors
      setCellError(
        errs?.length
          ? errs[0]
          : (err.response?.data?.message ?? 'Failed to save rating. Please try again.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Display row (picker closed) ────────────────────────────────────────────

  if (!open) {
    return (
      <div className="flex items-center gap-2 min-w-[130px]">
        {/* Current rating display */}
        {hasRated ? (
          <span className="flex items-center gap-1">
            <Star size={13} className="text-indigo-400 shrink-0" fill="currentColor" />
            <span className="text-sm text-indigo-700 font-medium tabular-nums">{currentRating}</span>
            <span className="text-xs text-gray-400">/ 5</span>
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Not rated</span>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={openPicker}
          aria-label={hasRated ? 'Modify your rating' : 'Submit a rating'}
          title={hasRated ? 'Modify your rating' : 'Submit a rating'}
          className={[
            'text-xs font-medium px-2.5 py-1 rounded-full border transition shrink-0',
            hasRated
              ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
              : 'border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50',
          ].join(' ')}
        >
          {hasRated ? 'Modify' : 'Rate'}
        </button>
      </div>
    )
  }

  // ── Picker row (open) ──────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 min-w-[200px]">
      <div className="flex items-center gap-1.5">
        <StarPicker
          value={pending}
          onChange={(n) => { setPending(n); setCellError('') }}
          disabled={submitting}
        />
        {/* Confirm */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!pending || submitting}
          aria-label="Confirm rating"
          title="Confirm rating"
          className="text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {submitting ? '…' : 'OK'}
        </button>
        {/* Cancel */}
        <button
          type="button"
          onClick={closePicker}
          disabled={submitting}
          aria-label="Cancel rating"
          title="Cancel"
          className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 transition disabled:opacity-40"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inline error */}
      {cellError && (
        <p className="text-xs text-red-500 leading-tight max-w-[200px]">{cellError}</p>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

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

export default function UserStores() {
  const [query, setQuery] = useState({
    ...DEFAULT_FILTERS,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: PAGE_SIZE,
  })
  const [draft, setDraft] = useState(DEFAULT_FILTERS)

  const [stores, setStores]         = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchStores = useCallback(async (q) => {
    setLoading(true)
    setError('')
    const params = Object.fromEntries(
      Object.entries(q).filter(([, v]) => v !== '' && v !== undefined)
    )
    try {
      const res = await getStores(params)
      setStores(res.data.data.stores)
      setPagination(res.data.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load stores. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStores(query) }, [fetchStores, query])

  // ── Local rating update — updates a single row without refetching ────────────
  // Overall Rating (averageRating) is NOT touched here — the rating response
  // from POST/PATCH does not include the updated overall average, and we must
  // not fabricate it. It will refresh naturally on the next fetchStores call.

  const handleRatingChange = useCallback((storeId, newRating) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId ? { ...s, userSubmittedRating: newRating } : s
      )
    )
  }, [])

  // ── Query handlers ──────────────────────────────────────────────────────────

  const applyFilters = () => setQuery((q) => ({ ...q, ...draft, page: 1 }))

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

  const hasActiveFilters =
    Object.values(draft).some(Boolean) ||
    Object.values({ name: query.name, address: query.address }).some(Boolean)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Stores</h1>
        <p className="mt-0.5 text-sm text-gray-500">Find stores and rate your experience.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            id="filter-store-name"
            type="text"
            placeholder="Search by name…"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <input
            id="filter-store-address"
            type="text"
            placeholder="Search by address…"
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
            Search
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

      {/* Table */}
      {!error && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    { label: 'Store Name',    field: 'name'          },
                    { label: 'Address',        field: 'address'       },
                    { label: 'Overall Rating', field: 'averageRating' },
                    { label: 'Your Rating',    field: null            },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && SORT_FIELDS.includes(field) && toggleSort(field)}
                      className={[
                        'px-4 py-3 font-semibold text-gray-600 whitespace-nowrap',
                        field ? 'cursor-pointer select-none hover:text-gray-900 transition-colors' : '',
                      ].join(' ')}
                    >
                      {label}
                      {field && SORT_FIELDS.includes(field) && (
                        <SortIcon field={field} sortBy={query.sortBy} sortOrder={query.sortOrder} />
                      )}
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
                          <p className="text-sm text-gray-400 mb-3">
                            {hasActiveFilters ? 'No stores match your search.' : 'No stores found.'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="text-sm text-indigo-600 hover:text-indigo-800 transition"
                            >
                              Clear search
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                    : stores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Store Name */}
                        <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">
                          {store.name}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                          {store.address}
                        </td>

                        {/* Overall Rating — backend AVG; never recalculated here */}
                        <td className="px-4 py-3">
                          <OverallRatingCell averageRating={store.averageRating} />
                        </td>

                        {/* Your Rating — interactive; state managed inside UserRatingCell */}
                        <td className="px-4 py-3">
                          <UserRatingCell
                            storeId={store.id}
                            userSubmittedRating={store.userSubmittedRating}
                            onRatingChange={handleRatingChange}
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
