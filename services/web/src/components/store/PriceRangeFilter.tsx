'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const RANGE_MAX = 300_000
const STEP = 1_000

interface Props {
  storeSlug: string
  initialMin: string
  initialMax: string
}

export function PriceRangeFilter({ storeSlug, initialMin, initialMax }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [min, setMin] = useState(initialMin ? Math.min(Number(initialMin), RANGE_MAX) : 0)
  const [max, setMax] = useState(initialMax ? Math.min(Number(initialMax), RANGE_MAX) : RANGE_MAX)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasFilter = min > 0 || max < RANGE_MAX

  const push = useCallback((lo: number, hi: number) => {
    const params = new URLSearchParams(sp.toString())
    if (lo > 0) params.set('min_price', String(lo))
    else params.delete('min_price')
    if (hi < RANGE_MAX) params.set('max_price', String(hi))
    else params.delete('max_price')
    params.delete('page')
    router.push(`/store/${storeSlug}/products?${params.toString()}`)
  }, [router, sp, storeSlug])

  function schedule(lo: number, hi: number) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(lo, hi), 500)
  }

  function onMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(Number(e.target.value), max - STEP)
    setMin(val)
    schedule(val, max)
  }

  function onMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(Number(e.target.value), min + STEP)
    setMax(val)
    schedule(min, val)
  }

  function clear() {
    setMin(0)
    setMax(RANGE_MAX)
    push(0, RANGE_MAX)
  }

  const minPct = (min / RANGE_MAX) * 100
  const maxPct = (max / RANGE_MAX) * 100

  const thumbClass = [
    'pointer-events-none absolute inset-x-0 h-0 appearance-none bg-transparent',
    '[&::-webkit-slider-thumb]:pointer-events-auto',
    '[&::-webkit-slider-thumb]:appearance-none',
    '[&::-webkit-slider-thumb]:h-[18px]',
    '[&::-webkit-slider-thumb]:w-[18px]',
    '[&::-webkit-slider-thumb]:rounded-full',
    '[&::-webkit-slider-thumb]:bg-white',
    '[&::-webkit-slider-thumb]:border-2',
    '[&::-webkit-slider-thumb]:border-gray-900',
    '[&::-webkit-slider-thumb]:shadow-sm',
    '[&::-webkit-slider-thumb]:cursor-pointer',
    '[&::-webkit-slider-thumb]:transition-transform',
    '[&::-webkit-slider-thumb]:hover:scale-110',
    '[&::-moz-range-thumb]:pointer-events-auto',
    '[&::-moz-range-thumb]:appearance-none',
    '[&::-moz-range-thumb]:h-[18px]',
    '[&::-moz-range-thumb]:w-[18px]',
    '[&::-moz-range-thumb]:rounded-full',
    '[&::-moz-range-thumb]:bg-white',
    '[&::-moz-range-thumb]:border-2',
    '[&::-moz-range-thumb]:border-gray-900',
    '[&::-moz-range-thumb]:shadow-sm',
    '[&::-moz-range-thumb]:cursor-pointer',
  ].join(' ')

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Գին</span>
        {hasFilter && (
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Մաքրել
          </button>
        )}
      </div>

      {/* Slider track */}
      <div className="relative flex items-center" style={{ height: 18 }}>
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-100" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-900 transition-all"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={0}
          max={RANGE_MAX}
          step={STEP}
          value={min}
          onChange={onMinChange}
          className={thumbClass}
          style={{ zIndex: min > RANGE_MAX - STEP * 2 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={0}
          max={RANGE_MAX}
          step={STEP}
          value={max}
          onChange={onMaxChange}
          className={thumbClass}
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Value labels */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {min === 0 ? '0' : min.toLocaleString()} ֏
        </span>
        <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {max >= RANGE_MAX ? `${RANGE_MAX.toLocaleString()}+` : max.toLocaleString()} ֏
        </span>
      </div>
    </div>
  )
}
