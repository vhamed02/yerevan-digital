'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle, Clock, Package, Truck, Star, XCircle, RefreshCw, CreditCard } from 'lucide-react'
import { pickLang } from '@/lib/i18n'
import type { StorefrontOrder } from '@/types'

interface Props {
  order: StorefrontOrder | null
  storeSlug: string
  isNew?: boolean
}

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#6366f1', '#ec4899', '#f97316', '#22c55e', '#eab308', '#06b6d4', '#8b5cf6']

function Confetti() {
  const [visible, setVisible] = useState(true)
  const pieces = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      rotate: -45 + Math.random() * 90,
    }))
  )[0]

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
          }}
        >
          <div style={{ width: 8, height: 12, backgroundColor: p.color, borderRadius: 2, transform: `rotate(${p.rotate}deg)` }} />
        </div>
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  )
}

// ── Status timeline ───────────────────────────────────────────────────────────

const STEPS = [
  { key: 'pending',    labelKey: 'orderTimeline.accepted',   icon: Clock   },
  { key: 'processing', labelKey: 'orderTimeline.processing', icon: Package },
  { key: 'shipped',    labelKey: 'orderTimeline.shipped',    icon: Truck   },
  { key: 'delivered',  labelKey: 'orderTimeline.delivered',  icon: Star    },
] as const

// statuses that map onto which step index is "reached"
const STATUS_STEP: Record<string, number> = {
  pending:    0,
  paid:       0, // paid still shows as "accepted" step
  processing: 1,
  shipped:    2,
  delivered:  3,
}

const TERMINAL: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
  cancelled: { labelKey: 'orderStatus.cancelled',  color: 'text-red-600 bg-red-50 border-red-200',     icon: XCircle   },
  refunded:  { labelKey: 'orderStatus.refunded', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: RefreshCw },
}

function StatusTimeline({ status }: { status: string }) {
  const t = useTranslations('storefront')
  const terminal = TERMINAL[status]
  if (terminal) {
    const Icon = terminal.icon
    return (
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${terminal.color}`}>
        <Icon className="h-5 w-5 shrink-0" />
        <span className="font-semibold text-sm">{t(terminal.labelKey)}</span>
      </div>
    )
  }

  const current = STATUS_STEP[status] ?? 0

  return (
    <div className="relative flex items-start justify-between gap-2">
      {/* connector line */}
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
                done
                  ? 'border-gray-900 bg-gray-900'
                  : active
                  ? 'border-gray-900 bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {done ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Icon className={`h-4 w-4 ${active ? 'text-gray-900' : 'text-gray-300'}`} />
              )}
            </div>
            <span className={`text-center text-xs font-medium leading-tight ${active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'}`}>
              {t(step.labelKey)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending:    'orderStatus.pending',
  paid:       'orderStatus.paid',
  processing: 'orderStatus.processing',
  shipped:    'orderStatus.shipped',
  delivered:  'orderStatus.delivered',
  cancelled:  'orderStatus.cancelled',
  refunded:   'orderStatus.refunded',
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:    'bg-sky-50 text-sky-700 border-sky-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
  refunded:   'bg-amber-50 text-amber-700 border-amber-200',
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrderConfirmationClient({ order, storeSlug, isNew = false }: Props) {
  const locale = useLocale()
  const t = useTranslations('storefront')
  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('hy-AM', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      {isNew && <Confetti />}

      <div className="mx-auto max-w-lg px-4 py-12">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {isNew ? t('order.received') : t('order.statusTitle')}
          </h1>
          {order && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xl font-extrabold tracking-wider text-indigo-600">
                #{order.order_number}
              </span>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {STATUS_LABEL_KEYS[order.status] ? t(STATUS_LABEL_KEYS[order.status]) : order.status}
              </span>
            </div>
          )}
          {formattedDate && (
            <p className="mt-1.5 text-sm text-gray-400">{formattedDate}</p>
          )}
          {isNew && order?.customer_email && (
            <p className="mt-2 text-sm text-gray-500">
              {t.rich('order.confirmationSent', {
                email: order.customer_email,
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          )}
        </div>

        {order ? (
          <>
            {/* Timeline */}
            <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6">
              <p className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                {t('order.progress')}
              </p>
              <StatusTimeline status={order.status} />
            </div>

            {/* Order summary */}
            <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                {t('checkout.orderSummary')}
              </p>
              {order.customer_name && (
                <p className="mb-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{order.customer_name}</span>
                </p>
              )}
              <ul className="mb-4 flex flex-col gap-2.5">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-gray-700">
                      {pickLang(item.product_name, locale)}
                      {item.variant_name && (
                        <span className="text-gray-400"> — {item.variant_name}</span>
                      )}{' '}
                      <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} ֏
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 font-bold text-gray-900">
                <span>{t('cart.total')}</span>
                <span>{order.total.toLocaleString()} ֏</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mb-8 text-center text-gray-500">{t('order.notFound')}</p>
        )}

        <div className="flex justify-center">
          <Link
            href={`/store/${storeSlug}`}
            className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
