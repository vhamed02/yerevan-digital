import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import type { StorefrontStore } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  const name = data ? data.name.hy || data.name.en : ''
  return { title: `Checkout — ${name} | Vendora` }
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

  return <Template.CheckoutForm storeSlug={slug} />
}
