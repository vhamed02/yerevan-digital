import Providers from '@/components/providers'
import SellerLayoutClient from '@/components/seller/SellerLayoutClient'
import { serverGet } from '@/lib/server-api'
import type { PublicCategory } from '@/types'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const data = await serverGet<{ data: PublicCategory[] }>('/categories', {
    next: { revalidate: 3600 },
  })
  const categories = data?.data ?? []

  return (
    <Providers>
      <SellerLayoutClient categories={categories}>{children}</SellerLayoutClient>
    </Providers>
  )
}
