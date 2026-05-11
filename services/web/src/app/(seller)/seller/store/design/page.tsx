import type { Metadata } from 'next'
import StoreDesignClient from '@/components/seller/StoreDesignClient'
import { serverAuthGet } from '@/lib/server-api'
import type { SellerTemplate, StoreDesignSettings } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Store Design — Vendora Seller',
}

export default async function StoreDesignPage() {
  const [templatesData, designData] = await Promise.all([
    serverAuthGet<{ data: SellerTemplate[] }>('/seller/templates'),
    serverAuthGet<{ data: StoreDesignSettings }>('/seller/store/design'),
  ])

  return (
    <StoreDesignClient
      templates={templatesData?.data ?? []}
      initialDesign={designData?.data ?? null}
    />
  )
}
