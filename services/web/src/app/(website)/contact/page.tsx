import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import StaticPageContent from '@/components/website/StaticPageContent'
import ContactForm from '@/components/website/ContactForm'
import type { Page } from '@/types'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/contact')
  if (!page) return { title: 'Contact Us — Vendora' }
  const title = locale === 'en' ? (page.meta_title?.en || page.title.en) : (page.meta_title?.hy || page.title.hy)
  const description = locale === 'en' ? page.meta_description?.en : page.meta_description?.hy
  return { title, description: description ?? undefined }
}

export default async function ContactPage() {
  const locale = await getLocale()
  const page = await serverGet<Page>('/pages/contact')
  if (!page) notFound()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <StaticPageContent page={page} locale={locale} bare />
      <ContactForm locale={locale} apiUrl={apiUrl} />
    </div>
  )
}
