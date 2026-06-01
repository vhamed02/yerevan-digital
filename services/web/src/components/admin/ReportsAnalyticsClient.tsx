'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import {
  Store,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Download,
  Search,
} from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import reportsApi from '@/lib/reportsApi'

interface StatusBlock {
  total: number
  by_status: Record<string, number>
}

interface Overview {
  generated_at: string
  stores: StatusBlock & { featured: number }
  sellers: StatusBlock
  products: StatusBlock
  orders: StatusBlock
  revenue: { gmv: number; paid_orders: number; average_order_value: number; currency: string }
  last_30_days: { new_stores: number; new_orders: number; revenue: number }
  top_stores: { id: number; name: string; slug: string; revenue: number }[]
}

interface SearchHit {
  type: string
  id: number
  uuid: string
  label: string
  sublabel: string
}

interface SearchResults {
  query: string
  stores: SearchHit[]
  products: SearchHit[]
  sellers: SearchHit[]
  orders: SearchHit[]
}

const EXPORTS = ['stores', 'sellers', 'products', 'orders'] as const

function amd(value: number): string {
  return `${Math.round(value).toLocaleString()} ֏`
}

export default function ReportsAnalyticsClient() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    reportsApi
      .get<Overview>('/overview')
      .then((res) => setOverview(res.data))
      .catch(() => setError('Failed to load reports. Your session may have expired — try logging in again.'))
      .finally(() => setLoading(false))
  }, [])

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) {
      setResults(null)
      return
    }
    setSearching(true)
    try {
      const res = await reportsApi.get<SearchResults>('/search', { params: { q: query } })
      setResults(res.data)
    } catch {
      setResults(null)
    } finally {
      setSearching(false)
    }
  }

  async function exportCsv(entity: string) {
    const token = Cookies.get('vendora_token')
    const res = await fetch(`/api/admin-reports/exports/${entity}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <p className="text-sm text-content-muted">Loading reports…</p>
  }

  if (error || !overview) {
    return <p className="text-sm text-status-error">{error || 'No data.'}</p>
  }

  const allHits = results
    ? [...results.stores, ...results.products, ...results.sellers, ...results.orders]
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-content-primary">Reports &amp; Analytics</h1>
          <p className="text-xs text-content-muted">
            As of {new Date(overview.generated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((entity) => (
            <button
              key={entity}
              onClick={() => exportCsv(entity)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-content-primary transition-colors hover:bg-surface-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              {entity}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Store} label="Stores" value={overview.stores.total} trend={`${overview.stores.featured} featured`} color="brand" />
        <StatCard icon={Users} label="Sellers" value={overview.sellers.total} color="info" />
        <StatCard icon={Package} label="Products" value={overview.products.total} color="success" />
        <StatCard icon={ShoppingCart} label="Orders" value={overview.orders.total} trend={`${overview.revenue.paid_orders} paid`} color="warning" />
        <StatCard icon={TrendingUp} label="GMV (paid)" value={amd(overview.revenue.gmv)} color="success" />
        <StatCard icon={Receipt} label="Avg order value" value={amd(overview.revenue.average_order_value)} color="brand" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard icon={Store} label="New stores · 30d" value={overview.last_30_days.new_stores} color="brand" />
        <StatCard icon={ShoppingCart} label="New orders · 30d" value={overview.last_30_days.new_orders} color="info" />
        <StatCard icon={TrendingUp} label="Revenue · 30d" value={amd(overview.last_30_days.revenue)} color="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-semibold text-content-primary">Top stores by revenue</p>
          <ul className="flex flex-col gap-2">
            {overview.top_stores.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 truncate text-content-primary">
                  <span className="text-content-muted">{i + 1}.</span>
                  {s.name}
                </span>
                <span className="font-medium text-content-primary">{amd(s.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-semibold text-content-primary">Breakdown by status</p>
          <div className="flex flex-col gap-3">
            {(['orders', 'products', 'stores'] as const).map((key) => (
              <div key={key}>
                <p className="mb-1 text-xs uppercase tracking-wide text-content-muted">{key}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(overview[key].by_status).map(([status, count]) => (
                    <span key={status} className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-content-primary">
                      {status}: <span className="font-medium">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <form onSubmit={runSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores, products, sellers, orders…"
              className="w-full rounded-lg border border-border bg-surface-secondary py-2 pl-9 pr-3 text-sm text-content-primary outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {results && (
          <div className="mt-4">
            {allHits.length === 0 ? (
              <p className="text-sm text-content-muted">No matches for “{results.query}”.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {allHits.map((hit) => (
                  <li key={`${hit.type}-${hit.id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="truncate text-content-primary">{hit.label}</span>
                    <span className="flex items-center gap-2 text-xs text-content-muted">
                      <span className="truncate">{hit.sublabel}</span>
                      <span className="rounded bg-surface-secondary px-2 py-0.5">{hit.type}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
