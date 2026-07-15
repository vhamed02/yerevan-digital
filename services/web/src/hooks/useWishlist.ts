'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'

/**
 * Saved-product state for storefront cards.
 *
 * The wishlist lives server-side and is per-account, so this is a no-op for
 * guests — the heart tells them to sign in rather than pretending to save.
 *
 * The saved set is fetched once per mount and shared through a module-level
 * store, so a grid of cards doesn't fire one request each.
 */

let cachedUuids: Set<string> | null = null
let inflight: Promise<Set<string>> | null = null
const subscribers = new Set<(uuids: Set<string>) => void>()

function publish(uuids: Set<string>) {
  cachedUuids = uuids
  subscribers.forEach((fn) => fn(new Set(uuids)))
}

async function loadUuids(): Promise<Set<string>> {
  if (cachedUuids) return cachedUuids
  if (inflight) return inflight

  inflight = api
    .get<{ product_uuids: string[] }>('/customer/wishlist/ids')
    .then((res) => {
      const set = new Set(res.data.product_uuids ?? [])
      publish(set)
      return set
    })
    .catch(() => new Set<string>())
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** Drop the cache on sign-out, or the next account inherits these hearts. */
export function resetWishlistCache() {
  cachedUuids = null
  publish(new Set())
}

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [uuids, setUuids] = useState<Set<string>>(() => cachedUuids ?? new Set())
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      // Signed out: drop the cache, or the next account to sign in on this tab
      // inherits the previous one's hearts.
      cachedUuids = null
      setUuids(new Set())
      return
    }

    const onChange = (next: Set<string>) => setUuids(next)
    subscribers.add(onChange)
    void loadUuids()

    return () => {
      subscribers.delete(onChange)
    }
  }, [isAuthenticated])

  const isSaved = useCallback((uuid: string) => uuids.has(uuid), [uuids])

  const toggle = useCallback(
    async (uuid: string) => {
      if (!isAuthenticated) return { needsAuth: true as const }

      const next = new Set(cachedUuids ?? uuids)
      const wasSaved = next.has(uuid)

      // Optimistic: the heart should respond immediately.
      wasSaved ? next.delete(uuid) : next.add(uuid)
      publish(next)
      setPending(uuid)

      try {
        if (wasSaved) {
          await api.delete(`/customer/wishlist/${uuid}`)
        } else {
          await api.post('/customer/wishlist', { product_uuid: uuid })
        }
        return { needsAuth: false as const, saved: !wasSaved }
      } catch {
        // Put it back the way it was.
        const reverted = new Set(cachedUuids ?? new Set<string>())
        wasSaved ? reverted.add(uuid) : reverted.delete(uuid)
        publish(reverted)
        return { needsAuth: false as const, failed: true as const }
      } finally {
        setPending(null)
      }
    },
    [isAuthenticated, uuids],
  )

  return { isSaved, toggle, pending, isAuthenticated }
}
