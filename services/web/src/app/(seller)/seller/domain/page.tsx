import type { Metadata } from 'next'
import DomainSellerClient from '@/components/seller/DomainSellerClient'
import { serverAuthGet } from '@/lib/server-api'
import type { SellerDomain } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Domain — Yerevan Digital Seller',
}

export default async function SellerDomainPage() {
  const domain = await serverAuthGet<SellerDomain>('/seller/domain')
  return <DomainSellerClient initialDomain={domain} />
}
