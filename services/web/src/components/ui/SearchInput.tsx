'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  loading?: boolean
  debounce?: number
  className?: string
}

function SearchInput({
  value: controlled,
  onChange,
  onSearch,
  placeholder = 'Search...',
  loading,
  debounce = 300,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = useState(controlled ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const value = controlled !== undefined ? controlled : internal

  useEffect(() => {
    if (controlled !== undefined) setInternal(controlled)
  }, [controlled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (controlled === undefined) setInternal(v)
    onChange?.(v)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch?.(v), debounce)
  }

  const clear = () => {
    if (controlled === undefined) setInternal('')
    onChange?.('')
    onSearch?.('')
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-content-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded border border-border bg-surface pl-9 pr-9 text-sm text-content-primary placeholder:text-content-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors'
        )}
        aria-label={placeholder}
      />
      {loading ? (
        <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-content-muted" aria-hidden="true" />
      ) : value ? (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 rounded text-content-muted hover:text-content-primary transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
