'use client'

import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  className?: string
}

function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  const locale = useLocale()
  const formatted = amount.toLocaleString('hy-AM')

  return (
    <span className={cn('tabular-nums', className)}>
      {locale === 'hy' ? `${formatted} ֏` : `AMD ${formatted}`}
    </span>
  )
}

export { CurrencyDisplay }
export type { CurrencyDisplayProps }
