'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export default function CreateSellerClient() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'active' | 'pending'>('active')
  const [locale, setLocale] = useState<'hy' | 'en'>('hy')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    if (!email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Required'
    else if (password.length < 8) e.password = 'At least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/admin/sellers', { name, email, phone: phone || undefined, password, status, locale }),
    onSuccess: (res) => {
      toast.success('Seller created')
      router.push(`/admin/sellers/${res.data.data.id}`)
    },
    onError: (err: any) => {
      const data = err?.response?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) {
          flat[k] = Array.isArray(v) ? (v[0] as string) : String(v)
        }
        setErrors(flat)
        toast.error('Please fix the errors below')
      } else {
        toast.error(data?.message ?? 'Failed to create seller')
      }
    },
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <Link href="/admin/sellers" className="hover:text-content-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Sellers
          </Link>
          <span>/</span>
          <span className="text-content-primary">New Seller</span>
        </div>
        <Button onClick={() => validate() && mutation.mutate()} loading={mutation.isPending}>
          <Save className="h-4 w-4" />
          Create Seller
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main */}
        <div className="flex flex-col gap-5">

          {/* Identity */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-muted">Identity</h2>
            <div className="flex flex-col gap-4">
              <Field label="Full Name" required error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={inputCls(errors.name)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" required error={errors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@example.com"
                    className={inputCls(errors.email)}
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+374 XX XXX XXX"
                    className={inputCls(errors.phone)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-muted">Password</h2>
            <Field label="Initial Password" required error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={cn(inputCls(errors.password), 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <p className="mt-2 text-xs text-content-muted">
              The seller will use this password to log in. They can change it from their account settings.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">

          {/* Status */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Status</h2>
            <div className="flex flex-col gap-2">
              {(['active', 'pending'] as const).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-surface-secondary has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50"
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium capitalize text-content-primary">{s}</p>
                    <p className="text-xs text-content-muted">
                      {s === 'active' ? 'Can log in and manage their store' : 'Account created but not yet active'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Locale */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Default Language</h2>
            <div className="grid grid-cols-2 gap-2">
              {([['hy', 'Armenian'], ['en', 'English']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLocale(val)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border py-3 text-sm transition-colors',
                    locale === val
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border text-content-secondary hover:border-brand-300 hover:bg-surface-secondary'
                  )}
                >
                  <span className="font-mono text-xs font-bold">{val.toUpperCase()}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-content-primary">
        {label} {required && <span className="text-status-error">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  )
}

function inputCls(error?: string) {
  return cn(
    'h-10 w-full rounded-lg border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
    error ? 'border-status-error' : 'border-border focus:border-brand-500'
  )
}
