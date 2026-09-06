import { useState, useEffect, useCallback } from 'react'
import { Users, Store, Star, RefreshCw } from 'lucide-react'
import { getDashboard } from '../../api/admin'

const STAT_CARDS = [
  { key: 'totalUsers',   label: 'Total Users',   icon: Users,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'totalStores',  label: 'Total Stores',  icon: Store,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'totalRatings', label: 'Total Ratings', icon: Star,   color: 'text-amber-600',  bg: 'bg-amber-50' },
]

function StatCard({ label, icon: Icon, color, bg, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5 tabular-nums">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 bg-gray-100 rounded" />
        <div className="h-8 w-16 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDashboard()
      // res.data = { success, message, data: { totalUsers, totalStores, totalRatings } }
      setStats(res.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ??
        'Failed to load dashboard statistics. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          System-wide overview of users, stores, and ratings.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            id="dashboard-retry"
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 shrink-0 transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Stat cards — loading skeletons or real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? STAT_CARDS.map((c) => <SkeletonCard key={c.key} />)
          : !error && stats && STAT_CARDS.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                icon={card.icon}
                color={card.color}
                bg={card.bg}
                value={stats[card.key]}
              />
            ))
        }
      </div>
    </div>
  )
}
