'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Store, Package, ShoppingCart } from 'lucide-react'
import type { PlatformStats } from '@/types'

function useCountUp(target: number, enabled: boolean, duration = 2000) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled || target === 0) return
    const start = Date.now()
    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, enabled, duration])

  return count
}

function StatItem({
  label,
  value,
  suffix = '',
  Icon,
}: {
  label: string
  value: number
  suffix?: string
  Icon: typeof Store
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const count = useCountUp(value, visible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-6 py-8 text-center shadow-sm backdrop-blur transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-heading text-5xl font-extrabold tracking-tight text-brand-600 sm:text-6xl">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-sm font-medium uppercase tracking-widest text-content-primary/45">
        {label}
      </span>
    </div>
  )
}

export default function StatsBar({ stats }: { stats: PlatformStats }) {
  const t = useTranslations('stats')

  return (
    <section className="relative overflow-hidden bg-brand-50 py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #e0e7ff 0%, transparent 45%), radial-gradient(circle at 80% 70%, #f3e8ff 0%, transparent 45%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatItem label={t('stores')} value={stats.stores_count} suffix="+" Icon={Store} />
          <StatItem label={t('products')} value={stats.products_count} suffix="+" Icon={Package} />
          <StatItem label={t('orders')} value={stats.orders_count} suffix="+" Icon={ShoppingCart} />
        </div>
      </div>
    </section>
  )
}
