import type { Metadata } from 'next'
import CouponsSellerClient from '@/components/seller/CouponsSellerClient'
import { serverAuthGet } from '@/lib/server-api'
import type { PaginatedResponse, SellerCoupon } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Coupons — Yerevan Digital Seller',
}

export default async function SellerCouponsPage() {
  const coupons = await serverAuthGet<PaginatedResponse<SellerCoupon>>('/seller/coupons')
  return <CouponsSellerClient initialCoupons={coupons?.data ?? []} />
}
