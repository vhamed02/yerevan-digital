import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Target of the proxy rewrite for a `<slug>.yerevan.digital` address with no
 * active store. Triggering notFound() here renders the sibling not-found.tsx
 * with a real 404 status.
 */
export default function StoreUnavailablePage() {
  notFound()
}
