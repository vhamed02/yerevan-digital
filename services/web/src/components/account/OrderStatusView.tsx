'use client'

import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle, Clock, Package, Truck, Star, XCircle, RefreshCw } from 'lucide-react'
import { pickLang } from '@/lib/i18n'
import type { AccountOrder } from '@/types'

const STEPS = [
  { key: 'pending', labelKey: 'orderTimeline.accepted', icon: Clock },
  { key: 'processing', labelKey: 'orderTimeline.processing', icon: Package },
  { key: 'shipped', labelKey: 'orderTimeline.shipped', icon: Truck },
  { key: 'delivered', labelKey: 'orderTimeline.delivered', icon: Star },
] as const

const STATUS_STEP: Record<string, number> = {
  pending: 0,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
}

const TERMINAL: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
  cancelled: { labelKey: 'orderStatus.cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  refunded: { labelKey: 'orderStatus.refunded', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: RefreshCw },
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending: 'orderStatus.pending',
  paid: 'orderStatus.paid',
  processing: 'orderStatus.processing',
  shipped: 'orderStatus.shipped',
  delivered: 'orderStatus.delivered',
  cancelled: 'orderStatus.cancelled',
  refunded: 'orderStatus.refunded',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-amber-50 text-amber-700 border-amber-200',
}

function StatusTimeline({ status }: { status: string }) {
  const t = useTranslations('storefront')
  const terminal = TERMINAL[status]
  if (terminal) {
    const Icon = terminal.icon
    return (
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${terminal.color}`}>
        <Icon className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold">{t(terminal.labelKey)}</span>
      </div>
    )
  }

  const current = STATUS_STEP[status] ?? 0

  return (
    <div className="relative flex items-start justify-between gap-2">
      <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100" style={{ zIndex: 0 }} />
      <div
        className="absolute left-0 top-5 h-0.5 bg-gray-900 transition-all duration-700"
        style={{ width: `${(current / (STEPS.length - 1)) * 100}%`, zIndex: 1 }}
      />
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = step.icon
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                done ? 'border-gray-900 bg-gray-900' : active ? 'border-gray-900 bg-white' : 'border-gray-200 bg-white'
              }`}
            >
              {done ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Icon className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-300'}`} />
              )}
            </div>
            <span
              className={`text-center text-xs font-medium leading-tight ${
                active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'
              }`}
            >
              {t(step.labelKey)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderStatusView({ order }: { order: AccountOrder }) {
  const locale = useLocale()
  const t = useTranslations('account')
  const ts = useTranslations('storefront')
  const amount = (n: number) => `${Number(n).toLocaleString()} ֏`
  const date = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('hy-AM', { year: 'numeric', month: 'long', day: 'numeric' }) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-content-primary">#{order.order_number}</h1>
          {date(order.created_at) && <p className="mt-1 text-sm text-content-muted">{date(order.created_at)}</p>}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            STATUS_COLORS[order.status] ?? 'border-gray-200 bg-gray-100 text-gray-600'
          }`}
        >
          {STATUS_LABEL_KEYS[order.status] ? ts(STATUS_LABEL_KEYS[order.status]) : order.status}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-content-muted">{t('progress')}</p>
        <StatusTimeline status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-content-muted">{t('items')}</p>
          <ul className="flex flex-col divide-y divide-border">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span className="text-content-secondary">
                  {pickLang(item.product_name, locale)}
                  {item.variant_name && <span className="text-content-muted"> — {item.variant_name}</span>}{' '}
                  <span className="text-content-muted">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-content-primary">{amount(item.total_price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-content-secondary">
              <dt>{t('subtotal')}</dt>
              <dd>{amount(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-content-secondary">
                <dt>{t('discount')}</dt>
                <dd>−{amount(order.discount)}</dd>
              </div>
            )}
            {order.shipping_cost > 0 && (
              <div className="flex justify-between text-content-secondary">
                <dt>{t('shipping')}</dt>
                <dd>{amount(order.shipping_cost)}</dd>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-content-secondary">
                <dt>{t('tax')}</dt>
                <dd>{amount(order.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-content-primary">
              <dt>{t('total')}</dt>
              <dd>{amount(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-content-muted">{t('customer')}</p>
            <p className="font-medium text-content-primary">{order.customer_name}</p>
            <p className="text-content-secondary">{order.customer_email}</p>
            {order.customer_phone && <p className="text-content-secondary">{order.customer_phone}</p>}
          </div>
          {order.shipping_address && (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-content-muted">
                {t('shippingAddress')}
              </p>
              <p className="text-content-secondary">
                {[order.shipping_address.line1, order.shipping_address.city, order.shipping_address.postal_code, order.shipping_address.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}
          {order.payment_method && (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-content-muted">{t('payment')}</p>
              <p className="capitalize text-content-secondary">{order.payment_method}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
