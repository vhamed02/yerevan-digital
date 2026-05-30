'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Tabs } from '@/components/ui/Tabs'
import { FileUpload } from '@/components/ui/FileUpload'
import { ConfirmModal } from '@/components/ui/Modal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import api from '@/lib/api'
import type { SellerStore, PublicCategory } from '@/types'

interface StoreSettingsClientProps {
  initialStore: SellerStore | null
  categories: PublicCategory[]
}

export default function StoreSettingsClient({ initialStore, categories }: StoreSettingsClientProps) {
  const [store, setStore] = useState<SellerStore>(
    initialStore ?? {
      id: 0,
      name: { hy: '', en: '' },
      slug: '',
      status: 'pending',
    }
  )
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/seller/store?_method=PATCH', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  })

  function buildFormData(fields: Partial<SellerStore> & { logo?: File; banner?: File }) {
    const fd = new FormData()
    if (fields.name) {
      fd.append('name[hy]', fields.name.hy)
      fd.append('name[en]', fields.name.en)
      if (fields.name.ru) fd.append('name[ru]', fields.name.ru)
    }
    if (fields.slug) fd.append('slug', fields.slug)
    if (fields.description) {
      fd.append('description[hy]', fields.description.hy)
      fd.append('description[en]', fields.description.en)
      if (fields.description.ru) fd.append('description[ru]', fields.description.ru)
    }
    if (fields.category_id) fd.append('category_id', String(fields.category_id))
    if (fields.phone) fd.append('phone', fields.phone)
    if (fields.email) fd.append('email', fields.email)
    if (fields.address) fd.append('address', fields.address)
    if (fields.social_instagram) fd.append('social_instagram', fields.social_instagram)
    if (fields.social_facebook) fd.append('social_facebook', fields.social_facebook)
    if (fields.meta_title) {
      fd.append('meta_title[hy]', fields.meta_title.hy)
      fd.append('meta_title[en]', fields.meta_title.en)
      if (fields.meta_title.ru) fd.append('meta_title[ru]', fields.meta_title.ru)
    }
    if (fields.meta_description) {
      fd.append('meta_description[hy]', fields.meta_description.hy)
      fd.append('meta_description[en]', fields.meta_description.en)
      if (fields.meta_description.ru) fd.append('meta_description[ru]', fields.meta_description.ru)
    }
    if (fields.logo) fd.append('logo', fields.logo)
    if (fields.banner) fd.append('banner', fields.banner)
    return fd
  }

  const generalContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="🇦🇲 Store Name"
          value={store.name.hy}
          onChange={(e) => setStore((s) => ({ ...s, name: { ...s.name, hy: e.target.value } }))}
        />
        <Input
          label="🇬🇧 Store Name"
          value={store.name.en}
          onChange={(e) => setStore((s) => ({ ...s, name: { ...s.name, en: e.target.value } }))}
        />
        <Input
          label="🇷🇺 Store Name"
          value={store.name.ru ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, name: { ...s.name, ru: e.target.value } }))}
        />
      </div>
      <Input
        label="Slug"
        value={store.slug}
        onChange={(e) => setStore((s) => ({ ...s, slug: e.target.value }))}
        prefix={<span className="text-xs">store/</span>}
      />
      <SearchableSelect
        label="Category"
        value={store.category_id ? String(store.category_id) : ''}
        onValueChange={(v) => setStore((s) => ({ ...s, category_id: v ? parseInt(v) : undefined }))}
        options={categories.map((c) => ({ value: String(c.id), label: c.name.hy || c.name.en }))}
        placeholder="Select category"
        searchPlaceholder="Search categories..."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Textarea
          label="Description (Armenian)"
          value={store.description?.hy ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, description: { ...(s.description ?? { hy: '', en: '' }), hy: e.target.value } }))}
          rows={3}
        />
        <Textarea
          label="Description (English)"
          value={store.description?.en ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, description: { ...(s.description ?? { hy: '', en: '' }), en: e.target.value } }))}
          rows={3}
        />
        <Textarea
          label="Description (Russian)"
          value={store.description?.ru ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, description: { ...(s.description ?? { hy: '', en: '' }), ru: e.target.value } }))}
          rows={3}
        />
      </div>
      <Input
        label="Phone"
        value={store.phone ?? ''}
        onChange={(e) => setStore((s) => ({ ...s, phone: e.target.value }))}
        type="tel"
      />
      <Input
        label="Contact Email"
        value={store.email ?? ''}
        onChange={(e) => setStore((s) => ({ ...s, email: e.target.value }))}
        type="email"
      />
      <Input
        label="Address"
        value={store.address ?? ''}
        onChange={(e) => setStore((s) => ({ ...s, address: e.target.value }))}
      />
      <div className="flex justify-end">
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(buildFormData({ name: store.name, slug: store.slug, description: store.description, category_id: store.category_id, phone: store.phone, email: store.email, address: store.address }))}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )

  const appearanceContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-content-primary">Logo</p>
          {store.logo_url && (
            <img src={store.logo_url} alt="Current logo" className="mb-2 h-16 w-16 rounded-lg object-cover border border-border" />
          )}
          <FileUpload
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            maxSize={5 * 1024 * 1024}
            onChange={(files) => setLogoFile(files[0] ?? null)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-content-primary">Banner</p>
          {store.banner_url && (
            <img src={store.banner_url} alt="Current banner" className="mb-2 h-16 w-full rounded-lg object-cover border border-border" />
          )}
          <FileUpload
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            maxSize={5 * 1024 * 1024}
            onChange={(files) => setBannerFile(files[0] ?? null)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(buildFormData({ logo: logoFile ?? undefined, banner: bannerFile ?? undefined }))}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )

  const socialContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <Input
        label="Instagram"
        value={store.social_instagram ?? ''}
        onChange={(e) => setStore((s) => ({ ...s, social_instagram: e.target.value }))}
        prefix={<span className="text-xs">instagram.com/</span>}
      />
      <Input
        label="Facebook"
        value={store.social_facebook ?? ''}
        onChange={(e) => setStore((s) => ({ ...s, social_facebook: e.target.value }))}
        prefix={<span className="text-xs">facebook.com/</span>}
      />
      <div className="flex justify-end">
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(buildFormData({ social_instagram: store.social_instagram, social_facebook: store.social_facebook }))}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )

  const seoContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Meta Title (Armenian)"
          value={store.meta_title?.hy ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_title: { ...(s.meta_title ?? { hy: '', en: '' }), hy: e.target.value } }))}
        />
        <Input
          label="Meta Title (English)"
          value={store.meta_title?.en ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_title: { ...(s.meta_title ?? { hy: '', en: '' }), en: e.target.value } }))}
        />
        <Input
          label="Meta Title (Russian)"
          value={store.meta_title?.ru ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_title: { ...(s.meta_title ?? { hy: '', en: '' }), ru: e.target.value } }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Textarea
          label="Meta Description (Armenian)"
          value={store.meta_description?.hy ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_description: { ...(s.meta_description ?? { hy: '', en: '' }), hy: e.target.value } }))}
          maxLength={160}
          showCounter
          rows={3}
        />
        <Textarea
          label="Meta Description (English)"
          value={store.meta_description?.en ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_description: { ...(s.meta_description ?? { hy: '', en: '' }), en: e.target.value } }))}
          maxLength={160}
          showCounter
          rows={3}
        />
        <Textarea
          label="Meta Description (Russian)"
          value={store.meta_description?.ru ?? ''}
          onChange={(e) => setStore((s) => ({ ...s, meta_description: { ...(s.meta_description ?? { hy: '', en: '' }), ru: e.target.value } }))}
          maxLength={160}
          showCounter
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate(buildFormData({ meta_title: store.meta_title, meta_description: store.meta_description }))}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )

  const dangerContent = (
    <div className="flex flex-col gap-4 rounded-xl border-2 border-status-error bg-red-50 p-5">
      <p className="text-sm font-semibold text-status-error">Danger Zone</p>
      <div>
        <p className="text-sm font-medium text-content-primary">Delete Store</p>
        <p className="mt-0.5 text-xs text-content-muted">
          Permanently delete your store and all products. This cannot be undone.
        </p>
      </div>
      <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
        Delete Store
      </Button>
    </div>
  )

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold text-content-primary">Store Settings</h1>
        <Tabs
          items={[
            { value: 'general', label: 'General', content: generalContent },
            { value: 'appearance', label: 'Appearance', content: appearanceContent },
            { value: 'social', label: 'Social', content: socialContent },
            { value: 'seo', label: 'SEO', content: seoContent },
            { value: 'danger', label: 'Danger Zone', content: dangerContent },
          ]}
        />
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Store"
        message="Are you sure? All products, orders, and data will be permanently deleted."
        confirmLabel="Delete Store"
        destructive
        onConfirm={() => {
          api.delete('/seller/store').then(() => {
            window.location.href = '/auth/login'
          })
        }}
      />
    </>
  )
}
