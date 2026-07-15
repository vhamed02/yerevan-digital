import type { Metadata } from 'next'
import SettingsAdminClient from '@/components/admin/SettingsAdminClient'
import { serverAuthGet } from '@/lib/server-api'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings — Yerevan Digital Admin',
}

export default async function AdminSettingsPage() {
  // store_settings is a string-valued key/value table; the client parses it.
  const data = await serverAuthGet<Record<string, string>>('/admin/settings')
  return <SettingsAdminClient initialSettings={data ?? null} />
}
