import type { Metadata } from 'next'
import { serverAuthGet } from '@/lib/server-api'
import SellerProfileClient from '@/components/seller/SellerProfileClient'
import type { User } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Profile — Vendora Seller',
}

export default async function SellerProfilePage() {
  const user = await serverAuthGet<User>('/seller/profile')

  if (!user) return null

  return <SellerProfileClient initialUser={user} />
}
