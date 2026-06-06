import type { Metadata } from 'next'
import StoreDesignClient from '@/components/seller/StoreDesignClient'
import { serverAuthGet } from '@/lib/server-api'
import type { SellerTemplate, StoreDesignSettings } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Store Design — Vendorex Seller',
}

export default async function StoreDesignPage() {
  const [templates, design] = await Promise.all([
    serverAuthGet<SellerTemplate[]>('/seller/templates'),
    serverAuthGet<StoreDesignSettings>('/seller/store/design'),
  ])

  return (
    <StoreDesignClient
      templates={templates ?? []}
      initialDesign={design ?? null}
    />
  )
}
