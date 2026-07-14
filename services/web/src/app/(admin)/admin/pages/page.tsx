import type { Metadata } from 'next'
import PagesAdminClient from '@/components/admin/PagesAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { Page } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pages — Yerevan Digital Admin',
}

export default async function PagesPage() {
  const pages = await serverAuthGet<Page[]>('/admin/pages')
  return <PagesAdminClient initialPages={pages ?? []} />
}
