import { notFound } from 'next/navigation'
import { StoreLayoutClient } from '@/components/store/StoreLayoutClient'
import { serverGet } from '@/lib/server-api'
import type { StorefrontStore, PublicCategory } from '@/types'

export default async function StoreSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [storeData, categoriesData] = await Promise.all([
    serverGet<StorefrontStore>(`/store/${slug}/info`),
    serverGet<PublicCategory[]>(`/store/${slug}/categories`, {
      next: { revalidate: 3600 },
    }),
  ])

  if (!storeData) notFound()

  return (
    <StoreLayoutClient
      store={storeData}
      categories={categoriesData ?? []}
    >
      {children}
    </StoreLayoutClient>
  )
}
