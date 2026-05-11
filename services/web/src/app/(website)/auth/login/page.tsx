import type { Metadata } from 'next'
import { Store } from 'lucide-react'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — Vendora',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-content-primary">
            <Store className="h-6 w-6 text-brand-500" />
            Vendora
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-bold text-content-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-content-secondary">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
