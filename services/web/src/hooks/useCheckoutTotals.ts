'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import api from '@/lib/api'
import type { ApiError, CouponPreview } from '@/types'

interface CheckoutTotals {
  couponCode: string | null
  discount: number
  shippingCost: number
  total: number
  couponError: string | null
  applying: boolean
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => void
}

/**
 * Coupon and shipping figures for the checkout summary.
 *
 * Everything here is a preview for the shopper's benefit — the checkout
 * endpoint re-resolves the coupon and re-quotes shipping against a
 * server-computed subtotal, and those values are what the order is charged at.
 */
export function useCheckoutTotals(
  storeSlug: string,
  subtotal: number,
  city: string,
): CheckoutTotals {
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)

  const previewCoupon = useCallback(
    async (code: string, against: number) => {
      const res = await api.post<CouponPreview>(`/store/${storeSlug}/coupons/preview`, {
        code,
        subtotal: against,
      })
      return res.data
    },
    [storeSlug],
  )

  const applyCoupon = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (trimmed === '') return

      setApplying(true)
      setCouponError(null)

      try {
        const preview = await previewCoupon(trimmed, subtotal)
        setCouponCode(preview.code)
        setDiscount(Number(preview.discount))
      } catch (error) {
        const message = (error as AxiosError<ApiError>).response?.data?.message
        setCouponCode(null)
        setDiscount(0)
        setCouponError(message ?? 'This coupon code is not valid.')
      } finally {
        setApplying(false)
      }
    },
    [previewCoupon, subtotal],
  )

  const removeCoupon = useCallback(() => {
    setCouponCode(null)
    setDiscount(0)
    setCouponError(null)
  }, [])

  // Re-check an applied coupon when the cart changes: editing the cart can drop
  // it below the coupon's minimum, and the shopper should see that before they
  // reach the checkout error.
  useEffect(() => {
    if (!couponCode) return

    let cancelled = false

    previewCoupon(couponCode, subtotal)
      .then((preview) => {
        if (cancelled) return
        setDiscount(Number(preview.discount))
        setCouponError(null)
      })
      .catch((error: AxiosError<ApiError>) => {
        if (cancelled) return
        setCouponCode(null)
        setDiscount(0)
        setCouponError(error.response?.data?.message ?? null)
      })

    return () => {
      cancelled = true
    }
    // couponCode is deliberately the trigger alongside subtotal; applyCoupon
    // already handles the first lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  // Shipping depends on the destination, so re-quote as the city is typed.
  useEffect(() => {
    if (subtotal <= 0) {
      setShippingCost(0)
      return
    }

    let cancelled = false

    const timer = setTimeout(() => {
      api
        .post<{ cost: string }>(`/store/${storeSlug}/shipping/quote`, { city, subtotal })
        .then((res) => {
          if (!cancelled) setShippingCost(Number(res.data.cost))
        })
        .catch(() => {
          // A failed quote must not block checkout; the server prices the order.
          if (!cancelled) setShippingCost(0)
        })
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [storeSlug, subtotal, city])

  return {
    couponCode,
    discount,
    shippingCost,
    total: Math.max(subtotal - discount + shippingCost, 0),
    couponError,
    applying,
    applyCoupon,
    removeCoupon,
  }
}
