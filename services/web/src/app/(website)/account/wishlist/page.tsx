import type { Metadata } from 'next'
import WishlistClient from '@/components/website/WishlistClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Wishlist — Yerevan Digital',
}

export default function AccountWishlistPage() {
  // Fetched client-side: the wishlist is per-account and never cacheable.
  return <WishlistClient />
}
