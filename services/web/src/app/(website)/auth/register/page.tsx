import type { Metadata } from 'next'
import { Store } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import RegisterForm from '@/components/auth/RegisterForm'
import { serverGet } from '@/lib/server-api'
import type { PublicCategory } from '@/types'

export const metadata: Metadata = {
  title: 'Create Your Store — Vendorex',
  description: 'Sign up and launch your Armenian online store on Vendorex.',
}

export default async function RegisterPage() {
  const data = await serverGet<{ data: PublicCategory[] }>('/categories', {
    next: { revalidate: 3600 },
  })
  const categories = data?.data ?? []

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface-secondary px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-content-primary">
            <Store className="h-6 w-6 text-brand-500" />
            Vendorex
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-bold text-content-primary">Create your store</h1>
          <p className="mt-1 text-sm text-content-secondary">Join hundreds of Armenian businesses selling online</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <RegisterForm categories={categories} />
        </div>

        <p className="mt-4 text-center text-sm text-content-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-brand-500 hover:text-brand-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
