'use client'

import { useEffect } from 'react'
import { clearPendingOrder, readPendingOrder } from '@/lib/payment'

/**
 * Recover the order id when the gateway sent the buyer back without one.
 *
 * Idram fixes SUCCESS_URL against the merchant account, so it cannot carry
 * `?order=<uuid>` per payment — the buyer lands here bare and the page has
 * nothing to show. The checkout stashed the uuid in sessionStorage before
 * handing off, so read it back and reload with the parameter in place.
 *
 * Only ever runs when `order` is absent, so the replaced URL cannot trigger it
 * again — no redirect loop even if the stored uuid is stale.
 */
export function PendingOrderRedirect({
  storeSlug,
  hasOrderParam,
}: {
  storeSlug: string
  hasOrderParam: boolean
}) {
  useEffect(() => {
    if (hasOrderParam) {
      clearPendingOrder(storeSlug)
      return
    }

    const uuid = readPendingOrder(storeSlug)
    if (!uuid) return

    clearPendingOrder(storeSlug)

    const url = new URL(window.location.href)
    url.searchParams.set('order', uuid)
    window.location.replace(url.toString())
  }, [storeSlug, hasOrderParam])

  return null
}
