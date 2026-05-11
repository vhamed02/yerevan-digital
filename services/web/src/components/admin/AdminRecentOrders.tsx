import type { AdminOrder } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface AdminRecentOrdersProps {
  orders: AdminOrder[]
}

export default function AdminRecentOrders({ orders }: AdminRecentOrdersProps) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-semibold text-content-primary">Recent Orders</p>
      </div>
      {orders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-content-muted">No recent orders</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                {['Order #', 'Store', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-content-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.uuid} className="hover:bg-surface-secondary transition-colors">
                  <td className="px-5 py-3 font-medium text-content-primary">{order.order_number}</td>
                  <td className="px-5 py-3 text-content-secondary">{order.store_name}</td>
                  <td className="px-5 py-3 text-content-secondary">{order.customer_name}</td>
                  <td className="px-5 py-3 text-content-primary">{order.amount.toLocaleString()} ֏</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 text-content-muted">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
