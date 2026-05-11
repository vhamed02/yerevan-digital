'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import Link from 'next/link'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import PasswordStrengthMeter from './PasswordStrengthMeter'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { PublicCategory, User, Store } from '@/types'
import { cn } from '@/lib/utils'

const step1Schema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

const step2Schema = z.object({
  store_name_hy: z.string().min(2, 'Store name in Armenian is required'),
  store_name_en: z.string().min(2, 'Store name in English is required'),
  store_slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  category_id: z.string().min(1, 'Please select a category'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface RegisterFormProps {
  categories: PublicCategory[]
}

export default function RegisterForm({ categories }: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const login = useAuthStore((s) => s.login)

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={step} />
      {step === 1 && (
        <Step1Form
          onNext={(data) => {
            setStep1Data(data)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <Step2Form
          categories={categories}
          onBack={() => setStep(1)}
          onSubmit={async (step2Data) => {
            if (!step1Data) return
            setIsSubmitting(true)
            try {
              const res = await api.post<{ token: string; user: User; store: Store }>('/auth/register', {
                ...step1Data,
                ...step2Data,
              })
              login({ user: res.data.user, token: res.data.token, store: res.data.store })
              setStep(3)
            } catch {
              toast.error('Registration failed. Please try again.')
            } finally {
              setIsSubmitting(false)
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {step === 3 && <SuccessStep />}
    </div>
  )
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Account', 'Your Store', 'Done']
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const num = i + 1 as 1 | 2 | 3
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done ? 'bg-brand-500 text-white' : active ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-content-muted'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : num}
              </div>
              {i < 2 && <div className={cn('h-px flex-1', done ? 'bg-brand-500' : 'bg-border')} />}
            </div>
            <span className={cn('text-xs font-medium', active ? 'text-brand-500' : 'text-content-muted')}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function Step1Form({ onNext }: { onNext: (data: Step1Data) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })

  const password = watch('password', '')

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-4" noValidate>
      <Input label="Full Name" placeholder="Ani Sargsyan" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" placeholder="ani@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone (optional)" type="tel" placeholder="+374 XX XXX XXX" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <div className="flex flex-col gap-1.5">
        <Input label="Password" type="password" placeholder="••••••••" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordStrengthMeter password={password} />
      </div>
      <Input label="Confirm Password" type="password" placeholder="••••••••" autoComplete="new-password" error={errors.password_confirmation?.message} {...register('password_confirmation')} />
      <Button type="submit" size="lg" className="mt-2 w-full">Continue →</Button>
    </form>
  )
}

function Step2Form({
  categories,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  categories: PublicCategory[]
  onBack: () => void
  onSubmit: (data: Step2Data) => void
  isSubmitting: boolean
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const storeNameEn = watch('store_name_en', '')
  const slug = watch('store_slug', '')

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (storeNameEn) {
      const generated = toSlug(storeNameEn)
      setValue('store_slug', generated, { shouldValidate: false })
    }
  }, [storeNameEn, setValue])

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean }>(`/stores/check-slug?slug=${slug}`)
        setSlugStatus(res.data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [slug])

  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name.hy || c.name.en }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-content-primary">🇦🇲 Store Name</label>
          <input
            placeholder="Անի Ստուդիո"
            className={cn(
              'h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content-primary placeholder:text-content-muted',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              errors.store_name_hy && 'border-status-error'
            )}
            {...register('store_name_hy')}
          />
          {errors.store_name_hy && <p className="text-xs text-status-error">{errors.store_name_hy.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-content-primary">🇬🇧 Store Name</label>
          <input
            placeholder="Ani Studio"
            className={cn(
              'h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content-primary placeholder:text-content-muted',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              errors.store_name_en && 'border-status-error'
            )}
            {...register('store_name_en')}
          />
          {errors.store_name_en && <p className="text-xs text-status-error">{errors.store_name_en.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-content-primary">Store URL</label>
        <div className="flex items-center gap-0">
          <span className="flex h-10 items-center rounded-l border border-r-0 border-border bg-surface-secondary px-3 text-sm text-content-muted">
            vendora.am/store/
          </span>
          <div className="relative flex-1">
            <input
              placeholder="ani-studio"
              className={cn(
                'h-10 w-full rounded-r border border-border bg-surface px-3 pr-8 text-sm text-content-primary placeholder:text-content-muted',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
                errors.store_slug && 'border-status-error'
              )}
              {...register('store_slug')}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-content-muted" />}
              {slugStatus === 'available' && <Check className="h-4 w-4 text-status-success" />}
              {slugStatus === 'taken' && <X className="h-4 w-4 text-status-error" />}
            </span>
          </div>
        </div>
        {slugStatus === 'available' && <p className="text-xs text-status-success">Available ✓</p>}
        {slugStatus === 'taken' && <p className="text-xs text-status-error">This URL is already taken</p>}
        {errors.store_slug && <p className="text-xs text-status-error">{errors.store_slug.message}</p>}
      </div>

      <Select
        label="Category"
        placeholder="Select a category"
        options={categoryOptions}
        error={errors.category_id?.message}
        onValueChange={(v) => setValue('category_id', v, { shouldValidate: true })}
      />

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
          Create Store
        </Button>
      </div>
    </form>
  )
}

function SuccessStep() {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-status-success/10">
        <Check className="h-10 w-10 animate-[scale-in_0.3s_ease-out] text-status-success" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-bold text-content-primary">Your store has been created!</h2>
        <p className="text-sm text-content-secondary">An admin will review and approve your store shortly.</p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {[
          { icon: '🛍️', label: 'Add your first product', href: '/seller/products/new' },
          { icon: '🎨', label: 'Choose a template', href: '/seller/store/design' },
          { icon: '📧', label: 'Check your email for confirmation', href: null },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border p-4 text-center">
            <span className="text-2xl" aria-hidden="true">{item.icon}</span>
            {item.href ? (
              <Link href={item.href} className="mt-2 block text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <p className="mt-2 text-xs text-content-secondary">{item.label}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
