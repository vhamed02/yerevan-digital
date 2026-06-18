import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ShoppingBag } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import CustomerRegisterForm from '@/components/auth/CustomerRegisterForm'

export const metadata: Metadata = {
  title: 'Create account — Vendorex',
}

export default async function CustomerRegisterPage() {
  const t = await getTranslations('account')

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-content-primary">
            <ShoppingBag className="h-6 w-6 text-brand-500" />
            Vendorex
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-bold text-content-primary">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-content-secondary">{t('register.subtitle')}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <CustomerRegisterForm />
        </div>
      </div>
    </main>
  )
}
