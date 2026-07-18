import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { StoreLayoutClient } from '@/components/store/StoreLayoutClient'
import { StoreBaseProvider } from '@/components/store/StoreBaseProvider'
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

  // On a store domain the storefront is served at the root, so links are
  // root-relative; on the platform path (preview) they keep the /store/<slug>
  // prefix. The proxy sets x-store-domain when serving via a domain.
  const base = (await headers()).get('x-store-domain') ? '' : `/store/${slug}`

  const [storeData, categoriesData] = await Promise.all([
    serverGet<StorefrontStore>(`/store/${slug}/info`),
    serverGet<PublicCategory[]>(`/store/${slug}/categories`, {
      next: { revalidate: 3600 },
    }),
  ])

  if (!storeData) notFound()

  return (
    <StoreBaseProvider base={base}>
      <StoreLayoutClient
        store={storeData}
        categories={categoriesData ?? []}
      >
        {children}
      </StoreLayoutClient>
    </StoreBaseProvider>
  )
}
