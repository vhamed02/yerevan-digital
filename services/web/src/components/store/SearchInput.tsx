'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function SearchInput({ storeSlug, initialValue }: { storeSlug: string; initialValue: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function push(q: string) {
    const params = new URLSearchParams(sp.toString())
    if (q) params.set('search', q)
    else params.delete('search')
    params.delete('page')
    router.push(`/store/${storeSlug}/products?${params.toString()}`)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(q), 500)
  }

  function clear() {
    setValue('')
    push('')
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Որոնել ապրանք..."
        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors sm:w-64"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
