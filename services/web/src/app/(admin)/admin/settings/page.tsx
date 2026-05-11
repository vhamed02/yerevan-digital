import type { Metadata } from 'next'
import SettingsAdminClient from '@/components/admin/SettingsAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminSettings } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings — Vendora Admin',
}

export default async function AdminSettingsPage() {
  const data = await serverAuthGet<AdminSettings>('/admin/settings')
  return <SettingsAdminClient initialSettings={data ?? null} />
}
