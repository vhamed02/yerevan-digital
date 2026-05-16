import type { Metadata } from 'next'
import CreateSellerClient from '@/components/admin/CreateSellerClient'

export const metadata: Metadata = { title: 'New Seller — Vendora Admin' }
export const dynamic = 'force-dynamic'

export default function NewSellerPage() {
  return <CreateSellerClient />
}
