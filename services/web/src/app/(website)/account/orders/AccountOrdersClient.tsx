'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Package, ChevronRight } from 'lucide-react'
import type { AccountOrder } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-sky-50 text-sky-700 border-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function AccountOrdersClient({ orders }: { orders: AccountOrder[] | null }) {
  const t = useTranslations('account')
  const ts = useTranslations('storefront')

  return (
    <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-heading text-2xl font-bold text-content-primary">{t('myOrders')}</h1>

      {orders === null ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="mb-4 text-content-secondary">{t('signInPrompt')}</p>
          <Link
            href="/auth/login"
            className="inline-flex rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {t('signIn')}
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-content-muted" />
          <p className="mb-4 text-content-secondary">{t('noOrders')}</p>
          <Link
            href="/stores"
            className="inline-flex rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {t('browseStores')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.uuid}>
              <Link
                href={`/account/orders/${order.uuid}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-surface-secondary"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary">#{order.order_number}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {new Date(order.created_at).toLocaleDateString('hy-AM', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden font-medium text-content-primary sm:inline">
                    {Number(order.total).toLocaleString()} ֏
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_COLORS[order.status] ?? 'border-gray-200 bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ts(`orderStatus.${order.status}`)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-content-muted" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
