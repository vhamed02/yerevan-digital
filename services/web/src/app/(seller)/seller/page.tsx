import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, ShoppingCart, TrendingUp, Clock, Plus, Bell, Palette, ExternalLink, Receipt, Eye, Trophy } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import StoreStatusBanner from '@/components/seller/StoreStatusBanner'
import { RevenueBarChart, OrderStatusDonut } from '@/components/seller/SellerCharts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { serverAuthGet } from '@/lib/server-api'
import { storeUrl } from '@/lib/storeUrl'
import type { SellerDashboardData, Store } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard — Yerevan Digital Seller',
}

export default async function SellerDashboardPage() {
  const [dashboardData, storeData] = await Promise.all([
    serverAuthGet<SellerDashboardData>('/seller/dashboard'),
    serverAuthGet<Store>('/seller/store'),
  ])

  const stats = dashboardData?.stats
  const revenueChart = dashboardData?.revenue_chart ?? []
  const ordersByStatus = dashboardData?.orders_by_status ?? []
  const recentOrders = dashboardData?.recent_orders ?? []
  const topProducts = dashboardData?.top_products ?? []
  const store = storeData

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
      {store && <StoreStatusBanner status={store.status} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.total_products ?? 0}
          trend={stats ? `${stats.active_products} active` : undefined}
          color="brand"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats?.total_orders ?? 0}
          trend={stats ? `${stats.orders_this_month} this month` : undefined}
          color="info"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue This Month"
          value={stats ? `${stats.revenue_this_month.toLocaleString()} ֏` : '—'}
          trend={stats ? `Today: ${stats.revenue_today.toLocaleString()} ֏` : undefined}
          color="success"
        />
        <StatCard
          icon={Receipt}
          label="Average Order"
          value={stats ? `${stats.average_order_value.toLocaleString()} ֏` : '—'}
          trend={stats ? `${stats.paid_orders} paid orders` : undefined}
          color="brand"
        />
        <StatCard
          icon={Eye}
          label="Conversion"
          value={stats ? `${stats.conversion_rate}%` : '—'}
          trend={stats ? `${stats.total_views.toLocaleString()} product views` : undefined}
          color="info"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={stats ? `${stats.total_revenue.toLocaleString()} ֏` : '—'}
          trend="Paid orders only"
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-semibold text-content-primary">Revenue — Last 14 Days</p>
          <RevenueBarChart data={revenueChart} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-semibold text-content-primary">Order Status</p>
          <OrderStatusDonut data={ordersByStatus} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-500" />
          <p className="text-sm font-semibold text-content-primary">Best Sellers</p>
        </div>
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-content-muted">
            No paid orders yet — best sellers appear once products start selling.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {topProducts.map((product, index) => (
              <li key={product.product_id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-500">
                  {index + 1}
                </span>
                {product.uuid ? (
                  <Link
                    href={`/seller/products/${product.uuid}`}
                    className="min-w-0 flex-1 truncate text-sm text-content-primary hover:text-brand-500"
                  >
                    {product.name.hy || product.name.en}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-content-primary">
                    {product.name.hy || product.name.en}
                  </span>
                )}
                <span className="shrink-0 text-xs text-content-muted">{product.units} sold</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-content-primary">
                  {product.revenue.toLocaleString()} ֏
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-content-primary">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/seller/products/new"
            className="flex items-center gap-2 rounded-lg border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-500 hover:bg-brand-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Link>
          <Link
            href="/seller/orders?status=pending"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-content-primary hover:bg-surface-secondary transition-colors"
          >
            <Bell className="h-4 w-4" />
            View Pending Orders
          </Link>
          <Link
            href="/seller/store/design"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-content-primary hover:bg-surface-secondary transition-colors"
          >
            <Palette className="h-4 w-4" />
            Change Store Design
          </Link>
          {store?.slug && (
            <a
              href={storeUrl(store)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-content-primary hover:bg-surface-secondary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Store
            </a>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-content-primary">Recent Orders</p>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-content-muted">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  {['Order #', 'Customer', 'Total', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-content-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.uuid} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-5 py-3 font-medium text-content-primary">{order.order_number}</td>
                    <td className="px-5 py-3 text-content-secondary">{order.customer_name}</td>
                    <td className="px-5 py-3 text-content-primary">{order.total.toLocaleString()} ֏</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-content-muted">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/seller/orders/${order.uuid}`}
                        className="text-xs font-medium text-brand-500 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
