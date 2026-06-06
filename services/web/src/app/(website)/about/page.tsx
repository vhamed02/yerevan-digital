import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import StaticPageContent from '@/components/website/StaticPageContent'
import { pickLang } from '@/lib/i18n'
import { localizedAlternates } from '@/lib/seo'
import type { Page } from '@/types'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/about')
  if (!page) return { title: 'About Us — Vendorex' }
  const title = pickLang(page.meta_title, locale) || pickLang(page.title, locale)
  const description = pickLang(page.meta_description, locale) || undefined
  return { title, description, alternates: localizedAlternates('/about', locale) }
}

export default async function AboutPage() {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/about')
  if (!page) notFound()
  return <StaticPageContent page={page} locale={locale} />
}
