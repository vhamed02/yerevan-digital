import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import { pickLang } from '@/lib/i18n'
import type { StorefrontStore } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const data = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  const name = data ? pickLang(data.name, locale) : ''
  return { title: `Checkout — ${name} | Yerevan Digital` }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const storeData = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  if (!storeData) notFound()

  const Template = await loadTemplate(storeData.active_template_key)

  return <Template.CheckoutForm storeSlug={slug} store={storeData} />
}
