'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

interface Props {
  storeSlug: string
  initialMin: string
  initialMax: string
}

export function PriceRangeFilter({ storeSlug, initialMin, initialMax }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [min, setMin] = useState(initialMin)
  const [max, setMax] = useState(initialMax)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasFilter = initialMin !== '' || initialMax !== ''

  function push(newMin: string, newMax: string) {
    const params = new URLSearchParams(sp.toString())
    if (newMin) params.set('min_price', newMin)
    else params.delete('min_price')
    if (newMax) params.set('max_price', newMax)
    else params.delete('max_price')
    params.delete('page') // reset to page 1
    router.push(`/store/${storeSlug}/products?${params.toString()}`)
  }

  function schedule(newMin: string, newMax: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(newMin, newMax), 600)
  }

  function clear() {
    setMin('')
    setMax('')
    push('', '')
  }

  const inputClass =
    'w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Գին</span>
      <input
        type="number"
        min={0}
        value={min}
        onChange={e => { setMin(e.target.value); schedule(e.target.value, max) }}
        placeholder="Նվ."
        className={inputClass}
      />
      <span className="text-gray-300">—</span>
      <input
        type="number"
        min={0}
        value={max}
        onChange={e => { setMax(e.target.value); schedule(min, e.target.value) }}
        placeholder="Առ."
        className={inputClass}
      />
      <span className="text-xs text-gray-400">֏</span>
      {hasFilter && (
        <button
          onClick={clear}
          className="ml-1 flex items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Clear price filter"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
