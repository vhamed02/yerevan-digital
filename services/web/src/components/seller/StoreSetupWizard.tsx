'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { toast } from 'sonner'
import { Store, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { Select } from '@/components/ui/Select'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { PublicCategory, Store as StoreType } from '@/types'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

const step1Schema = z.object({
  name_hy: z.string().min(2, 'Required'),
  name_en: z.string().min(2, 'Required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
  category_id: z.string().min(1, 'Select a category'),
  description_hy: z.string().optional(),
  description_en: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>

interface StoreSetupWizardProps {
  categories: PublicCategory[]
}

export default function StoreSetupWizard({ categories }: StoreSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [submitting, setSubmitting] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)
  const { updateStore, login, user, token } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })

  const nameEn = watch('name_en')
  const slug = watch('slug')

  useEffect(() => {
    if (nameEn) {
      const generated = nameEn
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40)
      setValue('slug', generated)
    }
  }, [nameEn, setValue])

  const checkSlug = useCallback(async (val: string) => {
    if (!val || val.length < 2) return
    setSlugStatus('checking')
    try {
      await api.get(`/stores/check-slug?slug=${val}`)
      setSlugStatus('available')
    } catch {
      setSlugStatus('taken')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (slug) checkSlug(slug) }, 500)
    return () => clearTimeout(timer)
  }, [slug, checkSlug])

  function onStep1Submit(data: Step1Data) {
    if (slugStatus === 'taken') return
    setStep1Data(data)
    setStep(2)
  }

  async function onFinish() {
    if (!step1Data) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name[hy]', step1Data.name_hy)
      formData.append('name[en]', step1Data.name_en)
      formData.append('slug', step1Data.slug)
      formData.append('category_id', step1Data.category_id)
      if (step1Data.description_hy) formData.append('description[hy]', step1Data.description_hy)
      if (step1Data.description_en) formData.append('description[en]', step1Data.description_en)
      formData.append('primary_color', primaryColor)
      if (logo) formData.append('logo', logo)
      if (banner) formData.append('banner', banner)

      const res = await api.post<{ data: StoreType }>('/seller/store', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newStore = res.data.data
      updateStore({
        id: newStore.id,
        name: newStore.name,
        slug: newStore.slug,
        status: newStore.status,
      })
      setAutoApproved(newStore.status === 'active')
      setStep(3)
    } catch {
      toast.error('Failed to create store. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Store className="h-6 w-6 text-brand-500" />
          <span className="font-heading text-lg font-bold text-content-primary">Setup Your Store</span>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step > n
                    ? 'bg-status-success text-white'
                    : step === n
                    ? 'bg-brand-500 text-white'
                    : 'bg-border text-content-muted'
                }`}
              >
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-status-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {step === 1 && (
            <form onSubmit={handleSubmit(onStep1Submit)} className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-bold text-content-primary">Store Info</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="🇦🇲 Armenian Name"
                  {...register('name_hy')}
                  error={errors.name_hy?.message}
                />
                <Input
                  label="🇬🇧 English Name"
                  {...register('name_en')}
                  error={errors.name_en?.message}
                />
              </div>
              <div>
                <Input
                  label="Store URL"
                  prefix={<span className="text-xs">vendora.am/store/</span>}
                  {...register('slug')}
                  error={errors.slug?.message}
                  helperText={
                    slugStatus === 'available'
                      ? '✓ Available'
                      : slugStatus === 'taken'
                      ? 'This URL is already taken'
                      : slugStatus === 'checking'
                      ? 'Checking…'
                      : undefined
                  }
                />
              </div>
              <Select
                label="Category"
                value={watch('category_id')}
                onValueChange={(v) => setValue('category_id', v)}
                options={categories.map((c) => ({ value: String(c.id), label: c.name.hy || c.name.en }))}
                error={errors.category_id?.message}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-content-primary">Description (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="🇦🇲 Armenian"
                    {...register('description_hy')}
                    className="h-10 flex-1 rounded border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="🇬🇧 English"
                    {...register('description_en')}
                    className="h-10 flex-1 rounded border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-lg font-bold text-content-primary">Appearance</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-content-primary">Logo (square)</p>
                  <FileUpload
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    maxSize={5 * 1024 * 1024}
                    onChange={(files) => setLogo(files[0] ?? null)}
                    className="h-32"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-content-primary">Banner (wide)</p>
                  <FileUpload
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    maxSize={5 * 1024 * 1024}
                    onChange={(files) => setBanner(files[0] ?? null)}
                    className="h-32"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-content-primary">Primary Color</p>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${primaryColor === color ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                  <div className="relative h-7 w-7">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
                      aria-label="Custom color"
                    />
                    <div
                      className="h-7 w-7 rounded-full border-2 border-dashed border-border"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={onFinish} loading={submitting}>
                  Create Store <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10">
                <CheckCircle className="h-10 w-10 text-status-success" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-content-primary">
                  {autoApproved ? 'Your store is live!' : 'Store submitted for review!'}
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  {autoApproved
                    ? 'Your store is live and ready for customers.'
                    : 'Your store has been submitted for review. You can add products while waiting.'}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <a
                  href="/seller/products/new"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-brand-500 px-4 py-3 text-sm font-medium text-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <span>📦</span> Add First Product
                </a>
                <a
                  href="/seller/store/design"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-brand-500 px-4 py-3 text-sm font-medium text-brand-500 hover:bg-brand-50 transition-colors"
                >
                  <span>🎨</span> Choose Template
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
