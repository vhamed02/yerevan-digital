import type { Metadata } from 'next'
import Link from 'next/link'
import { XCircle } from 'lucide-react'

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

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <XCircle className="h-12 w-12 text-red-500" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        Payment Failed
      </h1>
      <p className="mb-1 text-lg font-semibold text-gray-700">
        Վճարումը Չհաջողվեց
      </p>
      <p className="mb-8 mt-2 max-w-sm text-sm text-gray-500">
        Your payment was not completed. Your cart is still saved — you can try
        again or choose a different payment method.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={`/store/${slug}/cart`}
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Back to Cart
        </Link>
        <Link
          href={`/store/${slug}`}
          className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
