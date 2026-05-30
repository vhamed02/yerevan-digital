'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import PricingSection from './PricingSection'
import ProductImageUpload, { type ProductImageItem } from './ProductImageUpload'
import VariantEditor from './VariantEditor'
import SeoPreview from './SeoPreview'
import RichTextEditor from './RichTextEditor'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { SellerProduct, SellerVariant, PublicCategory } from '@/types'

const schema = z.object({
  name_hy: z.string().min(1, 'Required'),
  name_en: z.string().min(1, 'Required'),
  name_ru: z.string(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
  category_id: z.string().min(1, 'Select a category'),
  description_short_hy: z.string().max(200),
  description_short_en: z.string().max(200),
  description_short_ru: z.string().max(200),
  price: z.number().positive('Must be positive'),
  sku: z.string(),
  manage_stock: z.boolean(),
  stock: z.number().int().min(0),
  allow_backorders: z.boolean(),
  status: z.enum(['draft', 'active']),
  is_featured: z.boolean(),
  meta_title_hy: z.string(),
  meta_title_en: z.string(),
  meta_title_ru: z.string(),
  meta_description_hy: z.string().max(160),
  meta_description_en: z.string().max(160),
  meta_description_ru: z.string().max(160),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  product?: SellerProduct
  categories: PublicCategory[]
}

const LANG_TABS = ['hy', 'en', 'ru'] as const
type Lang = (typeof LANG_TABS)[number]
const LANG_LABELS: Record<Lang, string> = { hy: '🇦🇲 Armenian', en: '🇬🇧 English', ru: '🇷🇺 Russian' }
const LANG_NAMES: Record<Lang, string> = { hy: 'Armenian', en: 'English', ru: 'Russian' }

export default function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const { sellerStore } = useAuthStore()
  const isEdit = !!product

  const [descLang, setDescLang] = useState<Lang>('hy')
  const [seoLang, setSeoLang] = useState<Lang>('hy')
  const [descFullHy, setDescFullHy] = useState(product?.description_full?.hy ?? '')
  const [descFullEn, setDescFullEn] = useState(product?.description_full?.en ?? '')
  const [descFullRu, setDescFullRu] = useState(product?.description_full?.ru ?? '')
  const [images, setImages] = useState<ProductImageItem[]>(
    product?.images?.map((img) => ({ id: img.uuid, url: img.medium })) ?? []
  )
  const [variants, setVariants] = useState<SellerVariant[]>(product?.variants ?? [])
  const [comparePrice, setComparePrice] = useState<number | null>(product?.compare_price ?? null)
  const [costPrice, setCostPrice] = useState<number | null>(product?.cost_price ?? null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugTaken, setSlugTaken] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_hy: product?.name.hy ?? '',
      name_en: product?.name.en ?? '',
      name_ru: product?.name.ru ?? '',
      slug: product?.slug ?? '',
      category_id: product?.category ? String(product.category.id) : '',
      description_short_hy: product?.description_short?.hy ?? '',
      description_short_en: product?.description_short?.en ?? '',
      description_short_ru: product?.description_short?.ru ?? '',
      price: product?.price ?? 0,
      sku: product?.sku ?? '',
      manage_stock: product?.manage_stock ?? false,
      stock: product?.stock ?? 0,
      allow_backorders: product?.allow_backorders ?? false,
      status: product?.status === 'active' ? 'active' : 'draft',
      is_featured: product?.is_featured ?? false,
      meta_title_hy: product?.meta_title?.hy ?? '',
      meta_title_en: product?.meta_title?.en ?? '',
      meta_title_ru: product?.meta_title?.ru ?? '',
      meta_description_hy: product?.meta_description?.hy ?? '',
      meta_description_en: product?.meta_description?.en ?? '',
      meta_description_ru: product?.meta_description?.ru ?? '',
    },
  })

  const nameEn = watch('name_en')
  const slug = watch('slug')
  const manageStock = watch('manage_stock')
  const price = watch('price')
  const metaTitleHy = watch('meta_title_hy')
  const metaTitleEn = watch('meta_title_en')
  const metaTitleRu = watch('meta_title_ru')
  const metaDescHy = watch('meta_description_hy')
  const metaDescEn = watch('meta_description_en')
  const metaDescRu = watch('meta_description_ru')

  const descFullByLang: Record<Lang, string> = { hy: descFullHy, en: descFullEn, ru: descFullRu }
  const setDescFullByLang: Record<Lang, (v: string) => void> = { hy: setDescFullHy, en: setDescFullEn, ru: setDescFullRu }
  const metaTitleByLang: Record<Lang, string> = { hy: metaTitleHy, en: metaTitleEn, ru: metaTitleRu }
  const metaDescByLang: Record<Lang, string> = { hy: metaDescHy, en: metaDescEn, ru: metaDescRu }

  useEffect(() => {
    if (!isEdit && nameEn) {
      const generated = nameEn
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60)
      setValue('slug', generated)
    }
  }, [nameEn, isEdit, setValue])

  const checkSlug = useCallback(async (val: string) => {
    if (!val) return
    setSlugChecking(true)
    try {
      await api.get(`/seller/products/check-slug?slug=${val}${isEdit ? `&exclude=${product?.uuid}` : ''}`)
      setSlugTaken(false)
    } catch {
      setSlugTaken(true)
    } finally {
      setSlugChecking(false)
    }
  }, [isEdit, product?.uuid])

  useEffect(() => {
    const timer = setTimeout(() => { if (slug) checkSlug(slug) }, 500)
    return () => clearTimeout(timer)
  }, [slug, checkSlug])

  const saveMutation = useMutation({
    mutationFn: async ({ data, status }: { data: FormData; status: 'draft' | 'active' }) => {
      const formData = new FormData()
      formData.append('name[hy]', data.name_hy)
      formData.append('name[en]', data.name_en)
      if (data.name_ru) formData.append('name[ru]', data.name_ru)
      formData.append('slug', data.slug)
      formData.append('category_id', data.category_id)
      formData.append('price', String(data.price))
      formData.append('status', status)
      formData.append('is_featured', String(data.is_featured))
      formData.append('manage_stock', String(data.manage_stock))
      if (data.manage_stock) {
        formData.append('stock', String(data.stock))
        formData.append('allow_backorders', String(data.allow_backorders))
      }
      if (data.sku) formData.append('sku', data.sku)
      if (comparePrice) formData.append('compare_price', String(comparePrice))
      if (costPrice) formData.append('cost_price', String(costPrice))
      if (data.description_short_hy) formData.append('description_short[hy]', data.description_short_hy)
      if (data.description_short_en) formData.append('description_short[en]', data.description_short_en)
      if (data.description_short_ru) formData.append('description_short[ru]', data.description_short_ru)
      if (descFullHy) formData.append('description_full[hy]', descFullHy)
      if (descFullEn) formData.append('description_full[en]', descFullEn)
      if (descFullRu) formData.append('description_full[ru]', descFullRu)
      if (data.meta_title_hy) formData.append('meta_title[hy]', data.meta_title_hy)
      if (data.meta_title_en) formData.append('meta_title[en]', data.meta_title_en)
      if (data.meta_title_ru) formData.append('meta_title[ru]', data.meta_title_ru)
      if (data.meta_description_hy) formData.append('meta_description[hy]', data.meta_description_hy)
      if (data.meta_description_en) formData.append('meta_description[en]', data.meta_description_en)
      if (data.meta_description_ru) formData.append('meta_description[ru]', data.meta_description_ru)
      if (variants.length > 0) {
        formData.append('variants', JSON.stringify(variants))
      }
      images.forEach((img, i) => {
        if (img.file) formData.append(`images[${i}]`, img.file)
      })

      if (isEdit) {
        return api.post(`/seller/products/${product!.uuid}?_method=PATCH`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      return api.post('/seller/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'active' ? 'Product published' : 'Draft saved')
      router.push('/seller/products')
    },
    onError: () => toast.error('Failed to save product'),
  })

  function onSubmit(publishStatus: 'draft' | 'active') {
    handleSubmit((data) => {
      saveMutation.mutate({ data, status: publishStatus })
    })()
  }

  return (
    <>
      <div className="sticky top-16 z-20 flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <h1 className="font-heading text-lg font-bold text-content-primary truncate">
          {isEdit ? `Edit: ${product.name.hy || product.name.en}` : 'New Product'}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSubmit('draft')}
            loading={saveMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => onSubmit('active')}
            loading={saveMutation.isPending}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
      <div className="flex gap-6 py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Basic Info</h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                <Input
                  label="🇷🇺 Russian Name"
                  {...register('name_ru')}
                  error={errors.name_ru?.message}
                />
              </div>
              <Input
                label="Slug"
                {...register('slug')}
                error={errors.slug?.message ?? (slugTaken ? 'This slug is already taken' : undefined)}
                helperText={
                  slugChecking ? 'Checking…' : !slugTaken && slug ? '✓ Available' : undefined
                }
              />
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Category"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={categories.map((c) => ({ value: String(c.id), label: c.name.hy || c.name.en }))}
                    error={errors.category_id?.message}
                  />
                )}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Descriptions</h2>
            <div className="flex gap-1 mb-3 border-b border-border">
              {LANG_TABS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setDescLang(lang)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    descLang === lang
                      ? 'border-brand-500 text-brand-500'
                      : 'border-transparent text-content-muted hover:text-content-primary'
                  }`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Textarea
                key={`short-${descLang}`}
                label="Short Description"
                {...register(`description_short_${descLang}`)}
                maxLength={200}
                showCounter
                rows={2}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-content-primary">Full Description</label>
                <RichTextEditor
                  key={`full-${descLang}`}
                  value={descFullByLang[descLang]}
                  onChange={setDescFullByLang[descLang]}
                  placeholder={`Write full description in ${LANG_NAMES[descLang]}…`}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Pricing</h2>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <PricingSection
                  price={field.value}
                  comparePrice={comparePrice}
                  costPrice={costPrice}
                  onChange={(f, v) => {
                    if (f === 'price') field.onChange(v ?? 0)
                    else if (f === 'compare_price') setComparePrice(v)
                    else setCostPrice(v)
                  }}
                />
              )}
            />
            {errors.price && <p className="mt-1 text-xs text-status-error">{errors.price.message}</p>}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Inventory</h2>
            <div className="flex flex-col gap-4">
              <Input
                label="SKU"
                {...register('sku')}
                placeholder="e.g. PROD-001"
              />
              <label className="flex cursor-pointer items-center gap-3">
                <Controller
                  name="manage_stock"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${field.value ? 'bg-brand-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${field.value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                  )}
                />
                <span className="text-sm font-medium text-content-primary">Manage Stock</span>
              </label>
              {manageStock && (
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-brand-500/30">
                  <Input
                    label="Stock Quantity"
                    type="number"
                    min={0}
                    {...register('stock', { valueAsNumber: true })}
                    error={errors.stock?.message}
                  />
                  <label className="flex cursor-pointer items-center gap-3">
                    <Controller
                      name="allow_backorders"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${field.value ? 'bg-brand-500' : 'bg-border'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${field.value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                        </button>
                      )}
                    />
                    <span className="text-sm text-content-secondary">Allow Backorders</span>
                  </label>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Photos</h2>
            <ProductImageUpload images={images} onChange={setImages} />
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">Variants</h2>
            <VariantEditor variants={variants} onChange={setVariants} />
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-primary">SEO</h2>
            <div className="flex gap-1 mb-3 border-b border-border">
              {LANG_TABS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSeoLang(lang)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    seoLang === lang
                      ? 'border-brand-500 text-brand-500'
                      : 'border-transparent text-content-muted hover:text-content-primary'
                  }`}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Input key={`mt-${seoLang}`} label="Meta Title" {...register(`meta_title_${seoLang}`)} />
              <Textarea
                key={`md-${seoLang}`}
                label="Meta Description"
                {...register(`meta_description_${seoLang}`)}
                maxLength={160}
                showCounter
                rows={3}
              />
              <SeoPreview
                slug={slug}
                storeSlug={sellerStore?.slug}
                title={metaTitleByLang[seoLang]}
                description={metaDescByLang[seoLang]}
              />
            </div>
          </section>
        </div>

        <aside className="hidden w-52 shrink-0 xl:block">
          <div className="sticky top-28 flex flex-col gap-4">
            {isEdit && (product.view_count ?? 0) >= 0 && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Views</p>
                <div className="flex items-center gap-2 text-content-primary">
                  <Eye className="h-4 w-4 text-content-muted" />
                  <span className="text-xl font-bold">{(product.view_count ?? 0).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-content-muted">unique visitors (12h dedup)</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Status</p>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    {(['draft', 'active'] as const).map((s) => (
                      <label key={s} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="status-radio"
                          checked={field.value === s}
                          onChange={() => field.onChange(s)}
                          className="h-3.5 w-3.5 accent-brand-500"
                        />
                        <span className="text-sm text-content-primary capitalize">{s}</span>
                      </label>
                    ))}
                  </div>
                )}
              />

              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Visibility</p>
                <label className="flex cursor-pointer items-center gap-2">
                  <Controller
                    name="is_featured"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-brand-500"
                      />
                    )}
                  />
                  <span className="text-sm text-content-primary">Featured product</span>
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onSubmit('draft')}
                  loading={saveMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onSubmit('active')}
                  loading={saveMutation.isPending}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </>
  )
}
