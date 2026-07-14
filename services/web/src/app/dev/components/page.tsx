'use client'

import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { FileUpload } from '@/components/ui/FileUpload'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SearchInput } from '@/components/ui/SearchInput'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-content-primary border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function ComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 flex flex-col gap-12">
      <div>
        <h1 className="font-heading text-3xl font-bold text-content-primary">Component Showcase</h1>
        <p className="mt-1 text-content-secondary">Yerevan Digital design system — all UI primitives</p>
      </div>

      <Section title="Breadcrumb">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Seller', href: '/seller' },
            { label: 'Products' },
          ]}
        />
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          {(['default', 'outline', 'ghost', 'destructive', 'success'] as const).map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
            <Button key={s} size={s}>{s}</Button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Input">
        <Input
          label="Email"
          placeholder="you@example.com"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          prefix={<Search className="h-4 w-4" />}
        />
        <Input label="With error" placeholder="..." error="This field is required" />
        <Input label="With helper" placeholder="..." helperText="We'll never share your email." />
      </Section>

      <Section title="Textarea">
        <Textarea
          label="Description"
          placeholder="Write something..."
          value={textareaValue}
          onChange={(e) => setTextareaValue(e.target.value)}
          showCounter
          maxLength={200}
        />
        <Textarea label="With error" error="Cannot be empty" />
      </Section>

      <Section title="Select">
        <Select
          label="Category"
          placeholder="Pick a category"
          options={[
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'food', label: 'Food & Drinks' },
          ]}
        />
        <Select
          label="Grouped"
          placeholder="Pick one"
          groups={[
            {
              label: 'Fruits',
              options: [
                { value: 'apple', label: 'Apple' },
                { value: 'mango', label: 'Mango' },
              ],
            },
            {
              label: 'Veggies',
              options: [{ value: 'carrot', label: 'Carrot' }],
            },
          ]}
        />
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {(['default', 'success', 'warning', 'error', 'info', 'outline', 'secondary'] as const).map((v) => (
            <Badge key={v} variant={v}>{v}</Badge>
          ))}
        </div>
      </Section>

      <Section title="StatusBadge">
        <div className="flex flex-wrap gap-2">
          {['active', 'paid', 'delivered', 'pending', 'processing', 'suspended', 'failed', 'cancelled', 'draft', 'shipped'].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>A short description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-content-secondary">Card body content.</p>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-4">
          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
            <Avatar key={s} name="Hamed Najari" size={s} />
          ))}
          <Avatar src="https://i.pravatar.cc/80" name="User" size="lg" />
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="flex flex-col gap-3 max-w-sm">
          <Skeleton shape="line" />
          <Skeleton shape="line" width="60%" />
          <Skeleton shape="circle" width={40} height={40} />
          <Skeleton shape="rectangle" height={80} />
          <Skeleton shape="card" />
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs
          variant="underline"
          items={[
            { value: 'a', label: 'Overview', content: <p className="text-sm text-content-secondary">Overview content</p> },
            { value: 'b', label: 'Details', content: <p className="text-sm text-content-secondary">Details content</p> },
            { value: 'c', label: 'Disabled', content: <p />, disabled: true },
          ]}
        />
        <Tabs
          variant="pill"
          items={[
            { value: 'x', label: 'Pill A', content: <p className="text-sm">Pill A</p> },
            { value: 'y', label: 'Pill B', content: <p className="text-sm">Pill B</p> },
          ]}
        />
      </Section>

      <Section title="Modal">
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>Confirm Modal</Button>
        </div>
        <Modal open={modalOpen} onOpenChange={setModalOpen} title="Modal Title" description="This is a modal description.">
          <p className="text-sm text-content-secondary">Modal body content goes here.</p>
        </Modal>
        <ConfirmModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete item?"
          message="This action cannot be undone. The item will be permanently removed."
          confirmLabel="Delete"
          destructive
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>

      <Section title="LoadingSpinner">
        <div className="flex items-center gap-6">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </div>
      </Section>

      <Section title="SearchInput">
        <SearchInput placeholder="Search products..." className="max-w-sm" />
      </Section>

      <Section title="FileUpload">
        <FileUpload multiple />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start selling."
          action={{ label: 'Add Product', onClick: () => {} }}
        />
      </Section>

      <Section title="Typography & Colors">
        <div className="flex flex-col gap-2">
          <p className="font-heading text-2xl font-bold">Heading font (Plus Jakarta Sans)</p>
          <p className="font-body text-base">Body font (Inter) — Armenian: Բարի գալուստ Վենդոռա</p>
          <p className="font-mono text-sm">Mono font (JetBrains Mono) — const x = 42</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[50, 100, 500, 600, 700, 900].map((shade) => (
            <div key={shade} className={`h-10 w-16 rounded flex items-center justify-center text-xs bg-brand-${shade}`}>
              {shade}
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
