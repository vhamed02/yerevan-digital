'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import StatCard from './StatCard'
import ApproveStoreDialog from './ApproveStoreDialog'
import SuspendDialog from './SuspendDialog'
import DeleteDialog from './DeleteDialog'
import type { AdminStore } from '@/types'

interface StoreDetailAdminClientProps {
  store: AdminStore
}

export default function StoreDetailAdminClient({ store }: StoreDetailAdminClientProps) {
  const router = useRouter()
  const [showApprove, setShowApprove] = useState(false)
  const [showSuspend, setShowSuspend] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const storeName = store.name.hy || store.name.en

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stores"
            className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Stores
          </Link>
          <span className="text-content-muted">/</span>
          <span className="text-sm text-content-primary">{storeName}</span>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {store.banner_url && (
            <img
              src={store.banner_url}
              alt={storeName}
              className="h-40 w-full object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex items-start gap-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={storeName}
                  className="h-16 w-16 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-500/10 text-xl font-bold text-brand-500">
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-xl font-bold text-content-primary">{storeName}</h1>
                  <StatusBadge status={store.status} />
                  {store.is_featured && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-content-muted">/{store.slug}</p>
                {store.description && (
                  <p className="mt-2 text-sm text-content-secondary">
                    {store.description.hy || store.description.en}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Package} label="Products" value={store.product_count} color="brand" />
          <StatCard icon={ShoppingCart} label="Orders" value={store.order_count} color="info" />
          <StatCard
            icon={TrendingUp}
            label="Revenue"
            value={`${(store.revenue ?? 0).toLocaleString()} ֏`}
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {store.seller && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 text-sm font-semibold text-content-primary">Seller</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-content-primary">{store.seller.name}</p>
                  <p className="text-sm text-content-muted">{store.seller.email}</p>
                </div>
                <Link href={`/admin/sellers/${store.seller.id}`}>
                  <Button variant="outline" size="sm">View Seller</Button>
                </Link>
              </div>
            </div>
          )}

          {store.payment_gateways.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 text-sm font-semibold text-content-primary">Payment Gateways</p>
              <ul className="flex flex-col gap-2">
                {store.payment_gateways.map((gw) => (
                  <li key={gw.id} className="flex items-center justify-between">
                    <span className="text-sm text-content-primary">{gw.name.hy || gw.name.en}</span>
                    <StatusBadge
                      status={gw.is_platform_active ? 'active' : 'suspended'}
                      label={gw.is_platform_active ? 'Active' : 'Inactive'}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border-2 border-status-error bg-red-50 p-5">
          <p className="mb-4 text-sm font-semibold text-status-error">Actions</p>
          <div className="flex flex-wrap gap-3">
            {store.status === 'pending' && (
              <Button variant="success" size="sm" onClick={() => setShowApprove(true)}>
                Approve Store
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuspend(true)}
            >
              {store.status === 'suspended' ? 'Activate Store' : 'Suspend Store'}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
              Delete Store
            </Button>
          </div>
        </div>
      </div>

      <ApproveStoreDialog
        storeId={showApprove ? store.id : null}
        storeName={storeName}
        onClose={() => setShowApprove(false)}
        invalidateKey={['admin-stores', store.slug]}
      />
      <SuspendDialog
        targetId={showSuspend ? store.id : null}
        targetName={storeName}
        targetType="store"
        currentStatus={store.status}
        onClose={() => setShowSuspend(false)}
        invalidateKey={['admin-stores', store.slug]}
      />
      <DeleteDialog
        targetId={showDelete ? store.id : null}
        targetName={storeName}
        targetType="store"
        onClose={() => setShowDelete(false)}
        onDeleted={() => router.push('/admin/stores')}
        invalidateKey={['admin-stores']}
      />
    </>
  )
}
