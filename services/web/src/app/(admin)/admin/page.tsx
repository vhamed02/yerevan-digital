import type { Metadata } from 'next'
import { Users, Store, ShoppingCart, TrendingUp } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import PendingApprovalBanner from '@/components/admin/PendingApprovalBanner'
import { OrdersLineChart, OrdersPieChart } from '@/components/admin/AdminCharts'
import AdminRecentOrders from '@/components/admin/AdminRecentOrders'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminDashboardData } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard — Vendorex Admin',
}

export default async function AdminDashboardPage() {
  const data = await serverAuthGet<AdminDashboardData>('/admin/dashboard')

  const stats = data?.stats
  const pendingStores = data?.pending_stores ?? []
  const ordersChart = data?.orders_chart ?? []
  const ordersByStatus = data?.orders_by_status ?? []
  const recentOrders = data?.recent_orders ?? []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-content-primary">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Sellers"
          value={stats?.total_sellers ?? 0}
          trend={stats ? `+${stats.sellers_this_month} this month` : undefined}
          color="brand"
        />
        <StatCard
          icon={Store}
          label="Active Stores"
          value={stats?.active_stores ?? 0}
          trend={stats ? `+${stats.stores_this_month} this month` : undefined}
          color="success"
        />
        <StatCard
          icon={ShoppingCart}
          label="Orders Today"
          value={stats?.orders_today ?? 0}
          trend={stats ? `+${stats.orders_change_pct}% vs yesterday` : undefined}
          color="info"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue This Month"
          value={stats ? `${stats.revenue_this_month.toLocaleString()} ֏` : '—'}
          trend={stats ? `+${stats.revenue_change_pct}%` : undefined}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-content-primary">Orders — Last 30 Days</p>
          <OrdersLineChart data={ordersChart} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-semibold text-content-primary">Order Status</p>
          <OrdersPieChart data={ordersByStatus} />
        </div>
      </div>

      <PendingApprovalBanner stores={pendingStores} />

      <AdminRecentOrders orders={recentOrders} />
    </div>
  )
}
