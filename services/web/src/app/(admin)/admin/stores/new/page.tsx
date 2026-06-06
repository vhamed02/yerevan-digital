import type { Metadata } from 'next'
import CreateStoreClient from '@/components/admin/CreateStoreClient'

export const metadata: Metadata = { title: 'New Store — Vendorex Admin' }
export const dynamic = 'force-dynamic'

export default function NewStorePage() {
  return <CreateStoreClient />
}
