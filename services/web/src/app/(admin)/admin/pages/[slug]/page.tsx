import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverAuthGet } from '@/lib/server-api'
import PageEditorClient from '@/components/admin/PageEditorClient'
import type { Page } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Edit: ${slug} — Vendora Admin` }
}

export default async function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await serverAuthGet<Page>(`/admin/pages/${slug}`)
  if (!page) notFound()
  return <PageEditorClient page={page} />
}
