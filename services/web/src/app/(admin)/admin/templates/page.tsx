import type { Metadata } from 'next'
import TemplatesAdminClient from '@/components/admin/TemplatesAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminTemplate } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Templates — Yerevan Digital Admin',
}

export default async function TemplatesPage() {
  const data = await serverAuthGet<{ data: AdminTemplate[] }>('/admin/templates')
  return <TemplatesAdminClient initialTemplates={data?.data ?? []} />
}
