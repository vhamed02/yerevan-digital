'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { StorefrontOrder } from '@/types'

interface Props {
  order: StorefrontOrder | null
  storeSlug: string
}

const CONFETTI_COLORS = [
  '#6366f1', '#ec4899', '#f97316', '#22c55e', '#eab308', '#06b6d4', '#8b5cf6',
]

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function ConfettiPiece({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 8,
        height: 12,
        backgroundColor: color,
        borderRadius: 2,
        ...style,
      }}
    />
  )
}

export function OrderConfirmationClient({ order, storeSlug }: Props) {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: randomBetween(0, 100),
      delay: randomBetween(0, 1.5),
      duration: randomBetween(2.5, 5),
      rotate: randomBetween(-45, 45),
    }))
  )
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      {showConfetti && (
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
              <div
                style={{
                  width: 8,
                  height: 12,
                  backgroundColor: p.color,
                  borderRadius: 2,
                  transform: `rotate(${p.rotate}deg)`,
                }}
              />
            </div>
          ))}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Ձեր Պատվերն Ընդունվեց
        </h1>

        {order ? (
          <>
            <p className="mb-1 text-2xl font-extrabold tracking-wider text-indigo-600">
              #{order.order_number}
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Հաստատման նամակ ուղարկվեց{' '}
              <strong>{order.customer_email}</strong> հասցեին
            </p>

            <div className="mb-8 w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Պատվերի ամփոփում
              </p>
              <ul className="mb-4 flex flex-col gap-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product_name.hy || item.product_name.en}
                      {item.variant_name && (
                        <span className="text-gray-400"> — {item.variant_name}</span>
                      )}{' '}
                      × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} ֏
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 font-bold text-gray-900">
                <span>Ընդամենը</span>
                <span>{order.total.toLocaleString()} ֏</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mb-8 text-gray-500">Ձեր պատվերն ընդունվեց։</p>
        )}

        <Link
          href={`/store/${storeSlug}`}
          className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Շարունակել գնումները
        </Link>
      </div>
    </div>
  )
}
