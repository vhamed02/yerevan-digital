import Providers from '@/components/providers'
import SellerLayoutClient from '@/components/seller/SellerLayoutClient'
import { serverGet } from '@/lib/server-api'
import type { PublicCategory } from '@/types'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const categories = await serverGet<PublicCategory[]>('/categories', {
    next: { revalidate: 3600 },
  }) ?? []

  return (
    <Providers>
      <SellerLayoutClient categories={categories}>{children}</SellerLayoutClient>
    </Providers>
  )
}
