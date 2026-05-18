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
  const timestamps = {
    paid: order.paid_at,
    shipped: order.shipped_at,
    delivered: order.delivered_at,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
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
        <OrderTimeline status={order.status} timestamps={timestamps} />
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
                {order.items.map((item) => {
                  const name = item.product_name?.hy || item.product_name?.en || '—'
                  const variantName = item.variant_name?.hy || item.variant_name?.en
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-content-primary">{name}</span>
                        {item.sku && <span className="ml-2 text-xs text-content-muted">{item.sku}</span>}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">{variantName || '—'}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{item.unit_price.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{item.total_price.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {order.notes && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Customer Notes</p>
              <p className="text-sm text-content-secondary">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Summary</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-content-muted">Subtotal</dt>
                <dd>{order.subtotal.toLocaleString()} {order.currency}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-content-muted">Discount</dt>
                  <dd className="text-status-success">−{order.discount.toLocaleString()} {order.currency}</dd>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between">
                  <dt className="text-content-muted">Shipping</dt>
                  <dd>{order.shipping_cost.toLocaleString()} {order.currency}</dd>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-content-muted">Tax</dt>
                  <dd>{order.tax.toLocaleString()} {order.currency}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{order.total.toLocaleString()} {order.currency}</dd>
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

          {order.shipping_address && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Shipping Address</p>
              <address className="flex flex-col gap-1 text-sm not-italic text-content-secondary">
                {order.shipping_address.line1 && <span>{order.shipping_address.line1}</span>}
                {order.shipping_address.line2 && <span>{order.shipping_address.line2}</span>}
                {(order.shipping_address.city || order.shipping_address.postal_code) && (
                  <span>
                    {[order.shipping_address.city, order.shipping_address.postal_code].filter(Boolean).join(', ')}
                  </span>
                )}
                {order.shipping_address.country && <span>{order.shipping_address.country}</span>}
              </address>
            </div>
          )}

          {order.payment_method && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Payment</p>
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-content-muted">Method</dt>
                  <dd className="font-medium capitalize">{order.payment_method}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-content-muted">Status</dt>
                  <dd><StatusBadge status={order.payment_status} /></dd>
                </div>
                {order.paid_at && (
                  <div className="flex justify-between">
                    <dt className="text-content-muted">Paid at</dt>
                    <dd>{new Date(order.paid_at).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

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
