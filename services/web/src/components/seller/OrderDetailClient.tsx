'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import OrderTimeline from './OrderTimeline'
import OrderStatusUpdater from './OrderStatusUpdater'
import type { Order } from '@/types'

interface OrderDetailClientProps {
  order: Order
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/seller/orders"
          className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Orders
        </Link>
        <span className="text-content-muted">/</span>
        <span className="text-sm font-medium text-content-primary">{order.order_number}</span>
        <StatusBadge status={order.status} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-content-primary">Order Timeline</p>
        <OrderTimeline status={order.status} />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <p className="text-sm font-semibold text-content-primary">Items</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  {['Product', 'Variant', 'Qty', 'Unit ֏', 'Total ֏'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-content-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0].thumbnail}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover border border-border"
                          />
                        )}
                        <span className="font-medium text-content-primary">{item.product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {item.variant ? `${item.variant.name}: ${item.variant.value}` : '—'}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.items.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-content-muted">Order Notes</p>
              <p className="text-sm text-content-secondary">No notes from customer.</p>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Summary</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-content-muted">Subtotal</dt>
                <dd>{order.total.toLocaleString()} ֏</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{order.total.toLocaleString()} ֏</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Customer</p>
            <dl className="flex flex-col gap-1.5 text-sm">
              <dd className="font-medium text-content-primary">{order.customer_name}</dd>
              <dd className="text-content-muted">{order.customer_email}</dd>
              {order.customer_phone && <dd className="text-content-muted">{order.customer_phone}</dd>}
            </dl>
          </div>

          <OrderStatusUpdater
            orderUuid={order.uuid}
            currentStatus={order.status}
            invalidateKey={['seller-orders', order.uuid]}
          />
        </div>
      </div>
    </div>
  )
}
