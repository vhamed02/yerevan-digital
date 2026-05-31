import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { XCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Payment Failed | Vendora' }
}

export default async function CheckoutFailedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations('storefront')

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <XCircle className="h-12 w-12 text-red-500" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {t('payFailed.title')}
      </h1>
      <p className="mb-8 mt-2 max-w-sm text-sm text-gray-500">
        {t('payFailed.message')}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={`/store/${slug}/cart`}
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          {t('payFailed.returnToCart')}
        </Link>
        <Link
          href={`/store/${slug}`}
          className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
    </div>
  )
}
