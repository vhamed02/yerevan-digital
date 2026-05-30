'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LOCALES = [
  { code: 'hy', flag: '🇦🇲', label: 'Հայ' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'ru', flag: '🇷🇺', label: 'РУ' },
] as const

interface LanguageSwitcherProps {
  className?: string
}

function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale()
  const pathname = usePathname()

  const switchLocale = (next: string) => {
    if (next === locale) return
    const bare = pathname.replace(/^\/(en|hy|ru)(\/|$)/, '/').replace(/\/$/, '') || '/'
    const newPath = next === 'hy' ? bare : `/${next}${bare === '/' ? '' : bare}`
    window.location.href = newPath || '/'
  }

  return (
    <div className={cn('flex items-center gap-1 rounded-full border border-border p-1', className)}>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            locale === l.code
              ? 'bg-brand-500 text-white'
              : 'text-content-secondary hover:text-content-primary'
          )}
          aria-pressed={locale === l.code}
          aria-label={`Switch to ${l.label}`}
        >
          <span aria-hidden="true">{l.flag}</span>
          {l.label}
        </button>
      ))}
    </div>
  )
}

export { LanguageSwitcher }
export type { LanguageSwitcherProps }
