'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, X } from 'lucide-react'
import api from '@/lib/api'
import { clearPendingOrder } from '@/lib/payment'

interface CardPaymentFrameProps {
  /** Gateway URL to embed — Idram's ccepayMerchant card form. */
  url: string
  storeSlug: string
  orderUuid: string
  /** Where to send the buyer once the order is confirmed paid. */
  successUrl: string
  onCancel: () => void
}

const POLL_INTERVAL_MS = 3000

/**
 * Idram's bank-card surface renders inside an iframe on our own page rather
 * than navigating away.
 *
 * Because the frame is cross-origin we cannot observe what happens inside it —
 * so the order itself is the signal. Idram POSTs its confirmation to RESULT_URL
 * server-side, and this component polls the public order endpoint until
 * `payment_status` flips to `paid`, then forwards the buyer to the confirmation
 * page. Polling is the only reliable channel here: there is no postMessage
 * contract with Idram, and the redirect targets are fixed merchant-wide.
 */
export function CardPaymentFrame({
  url,
  storeSlug,
  orderUuid,
  successUrl,
  onCancel,
}: CardPaymentFrameProps) {
  const t = useTranslations('storefront')
  const [failed, setFailed] = useState(false)
  const settled = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let cancelled = false

    const poll = async () => {
      try {
        const res = await api.get<{ payment_status: string }>(
          `/store/${storeSlug}/orders/${orderUuid}`,
        )

        if (cancelled || settled.current) return

        if (res.data.payment_status === 'paid') {
          settled.current = true
          clearPendingOrder(storeSlug)
          window.location.href = successUrl
          return
        }

        if (res.data.payment_status === 'failed') {
          settled.current = true
          setFailed(true)
          return
        }
      } catch {
        // A transient error must not end the payment — the buyer may still be
        // mid-flow inside the frame. Keep polling.
      }

      if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [storeSlug, orderUuid, successUrl])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('checkout.cardPaymentTitle')}
    >
      <div className="flex max-h-full w-full max-w-[460px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('checkout.cardPaymentTitle')}
            </h2>
            <p className="mt-1 text-xs text-gray-500">{t('checkout.cardPaymentWaiting')}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t('checkout.cardPaymentCancel')}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {failed ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">{t('payFailed.message')}</p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {t('checkout.cardPaymentCancel')}
            </button>
          </div>
        ) : (
          <>
            <iframe
              src={url}
              title={t('checkout.cardPaymentTitle')}
              className="h-[520px] w-full border-0"
            />
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 p-3 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('checkout.processing')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
