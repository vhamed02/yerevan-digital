import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import StaticPageContent from '@/components/website/StaticPageContent'
import type { Page } from '@/types'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/privacy')
  if (!page) return { title: 'Privacy Policy — Vendora' }
  const title = locale === 'en' ? (page.meta_title?.en || page.title.en) : (page.meta_title?.hy || page.title.hy)
  const description = locale === 'en' ? page.meta_description?.en : page.meta_description?.hy
  return { title, description: description ?? undefined }
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/privacy')
  if (!page) notFound()
  return <StaticPageContent page={page} locale={locale} />
}
