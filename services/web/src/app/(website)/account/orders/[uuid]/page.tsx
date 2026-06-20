import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { serverAuthGet } from '@/lib/server-api'
import type { AccountOrder } from '@/types'
import OrderStatusView from '@/components/account/OrderStatusView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order — Vendorex',
}

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const order = await serverAuthGet<AccountOrder>(`/customer/orders/${uuid}`)
  const t = await getTranslations('account')

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm text-content-secondary transition-colors hover:text-content-primary"
      >
        ← {t('backToOrders')}
      </Link>

      {order ? (
        <OrderStatusView order={order} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="mb-4 text-content-secondary">{t('orderNotFound')}</p>
          <Link
            href="/auth/login"
            className="inline-flex rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {t('signIn')}
          </Link>
        </div>
      )}
    </main>
  )
}
