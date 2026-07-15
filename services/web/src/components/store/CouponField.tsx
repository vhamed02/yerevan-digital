'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'

interface CouponFieldProps {
  couponCode: string | null
  couponError: string | null
  applying: boolean
  onApply: (code: string) => void
  onRemove: () => void
  disabled?: boolean
}

/** Template-agnostic coupon input for the checkout summary. */
export function CouponField({
  couponCode,
  couponError,
  applying,
  onApply,
  onRemove,
  disabled,
}: CouponFieldProps) {
  const t = useTranslations('storefront')
  const [value, setValue] = useState('')

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-green-800">
          <Check className="h-4 w-4 shrink-0" />
          <span className="truncate font-mono font-semibold">{couponCode}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setValue('')
            onRemove()
          }}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-green-800 hover:text-green-900"
        >
          <X className="h-3 w-3" />
          {t('checkout.couponRemove')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled={disabled || applying}
          placeholder={t('checkout.couponPlaceholder')}
          aria-label={t('checkout.coupon')}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          // Enter would otherwise submit the surrounding checkout form.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onApply(value)
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case focus:border-gray-900 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || applying || value.trim() === ''}
          onClick={() => onApply(value)}
          className="shrink-0 rounded-lg border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('checkout.couponApply')}
        </button>
      </div>
      {couponError && <p className="text-xs text-red-600">{couponError}</p>}
    </div>
  )
}
