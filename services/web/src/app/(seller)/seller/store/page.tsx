import type { Metadata } from 'next'
import StoreSettingsClient from '@/components/seller/StoreSettingsClient'
import { serverAuthGet, serverGet } from '@/lib/server-api'
import type { SellerStore, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Store Settings — Vendora Seller',
}

export default async function StoreSettingsPage() {
  const [storeData, categoriesData] = await Promise.all([
    serverAuthGet<SellerStore>('/seller/store'),
    serverGet<PublicCategory[]>('/categories', { next: { revalidate: 3600 } }),
  ])

  return (
    <StoreSettingsClient
      initialStore={storeData ?? null}
      categories={categoriesData ?? []}
    />
  )
}
