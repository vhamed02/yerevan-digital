'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
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

function StatItem({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const count = useCountUp(value, visible)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 text-center">
      <span className="font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm font-medium uppercase tracking-widest text-white/35">{label}</span>
    </div>
  )
}

export default function StatsBar({ stats }: { stats: PlatformStats }) {
  const t = useTranslations('stats')

  return (
    <section className="relative overflow-hidden bg-surface-dark py-20">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <StatItem label={t('stores')} value={stats.stores_count} suffix="+" />
          <StatItem label={t('products')} value={stats.products_count} suffix="+" />
          <StatItem label={t('orders')} value={stats.orders_count} suffix="+" />
        </div>
      </div>
    </section>
  )
}
