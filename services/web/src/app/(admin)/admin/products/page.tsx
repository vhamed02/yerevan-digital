import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products — Vendorex Admin',
}

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-content-primary">Products</h1>
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border bg-surface text-content-muted">
        Product management is available in the seller panel
      </div>
    </div>
  )
}
