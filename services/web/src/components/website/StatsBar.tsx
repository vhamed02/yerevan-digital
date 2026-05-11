'use client'

import { useEffect, useRef, useState } from 'react'
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
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
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
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span className="font-heading text-4xl font-bold text-white sm:text-5xl">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm font-medium text-white/70">{label}</span>
    </div>
  )
}

interface StatsBarProps {
  stats: PlatformStats
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-brand-700 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <StatItem label="Registered Stores" value={stats.stores_count} suffix="+" />
          <StatItem label="Products Listed" value={stats.products_count} suffix="+" />
          <StatItem label="Orders Completed" value={stats.orders_count} suffix="+" />
        </div>
      </div>
    </section>
  )
}
