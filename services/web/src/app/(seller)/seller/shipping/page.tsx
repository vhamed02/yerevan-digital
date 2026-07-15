import type { Metadata } from 'next'
import ShippingSellerClient from '@/components/seller/ShippingSellerClient'
import { serverAuthGet } from '@/lib/server-api'
import type { SellerShippingZone } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shipping — Yerevan Digital Seller',
}

export default async function SellerShippingPage() {
  const zones = await serverAuthGet<SellerShippingZone[]>('/seller/shipping-zones')
  return <ShippingSellerClient initialZones={zones ?? []} />
}
