'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Package, ShoppingCart, TrendingUp, Mail, Phone, Globe, Calendar, Clock, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import StatCard from './StatCard'
import SuspendDialog from './SuspendDialog'
import DeleteDialog from './DeleteDialog'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { AdminSeller } from '@/types'

interface SellerDetailClientProps {
  seller: AdminSeller
}

function SellerDetailsCard({ seller }: { seller: AdminSeller }) {
  const rows: { label: string; icon: React.ReactNode; value: React.ReactNode }[] = [
    {
      label: 'Email',
      icon: <Mail className="h-4 w-4" />,
      value: <a href={`mailto:${seller.email}`} className="text-brand-500 hover:underline">{seller.email}</a>,
    },
    ...(seller.phone ? [{
      label: 'Phone',
      icon: <Phone className="h-4 w-4" />,
      value: seller.phone,
    }] : []),
    ...(seller.locale ? [{
      label: 'Locale',
      icon: <Globe className="h-4 w-4" />,
      value: seller.locale.toUpperCase(),
    }] : []),
    {
      label: 'Status',
      icon: <span className="h-4 w-4" />,
      value: <StatusBadge status={seller.status} />,
    },
    {
      label: 'Joined',
      icon: <Calendar className="h-4 w-4" />,
      value: new Date(seller.created_at).toLocaleString(),
    },
    ...(seller.last_login_at ? [{
      label: 'Last login',
      icon: <Clock className="h-4 w-4" />,
      value: new Date(seller.last_login_at).toLocaleString(),
    }] : []),
  ]

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-4 text-sm font-semibold text-content-primary">Seller Details</p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ label, icon, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 text-content-muted">{icon}</span>
            <div>
              <dt className="text-xs text-content-muted">{label}</dt>
              <dd className="mt-0.5 text-sm text-content-primary">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ChangePasswordCard({ sellerId }: { sellerId: number }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.put(`/admin/sellers/${sellerId}/password`, {
        password,
        password_confirmation: confirm,
      })
      toast.success('Password updated')
      setPassword('')
      setConfirm('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-content-muted" />
        <p className="text-sm font-semibold text-content-primary">Change Password</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-muted">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            placeholder="Min 8 characters"
            className="h-9 w-56 rounded-lg border border-border bg-surface px-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-muted">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            placeholder="Repeat password"
            className="h-9 w-56 rounded-lg border border-border bg-surface px-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Set Password'}
        </Button>
      </form>
    </div>
  )
}

export default function SellerDetailClient({ seller }: SellerDetailClientProps) {
  const router = useRouter()
  const [showSuspend, setShowSuspend] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sellers"
            className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Sellers
          </Link>
          <span className="text-content-muted">/</span>
          <span className="text-sm text-content-primary">{seller.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-2xl font-bold text-brand-500">
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-content-primary">{seller.name}</p>
                <p className="text-sm text-content-muted">{seller.email}</p>
                {seller.phone && <p className="text-sm text-content-muted">{seller.phone}</p>}
              </div>
              <StatusBadge status={seller.status} />
              <div className="w-full border-t border-border pt-3 text-left">
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-content-muted">Joined</dt>
                    <dd className="text-content-primary">
                      {new Date(seller.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {seller.last_login_at && (
                    <div className="flex justify-between">
                      <dt className="text-content-muted">Last login</dt>
                      <dd className="text-content-primary">
                        {new Date(seller.last_login_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            {seller.store && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="mb-3 text-sm font-semibold text-content-primary">Store</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-content-primary">
                      {seller.store.name.hy || seller.store.name.en}
                    </p>
                    <p className="text-sm text-content-muted">/{seller.store.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={seller.store.status} />
                    <Link href={`/admin/stores/${seller.store.slug}`}>
                      <Button variant="outline" size="sm">View Store</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                icon={Package}
                label="Products"
                value={seller.product_count}
                color="brand"
              />
              <StatCard
                icon={ShoppingCart}
                label="Store Count"
                value={seller.store_count}
                color="info"
              />
              <StatCard
                icon={TrendingUp}
                label="Revenue"
                value={`${(seller.total_revenue ?? 0).toLocaleString()} ֏`}
                color="success"
              />
            </div>
          </div>
        </div>

        <SellerDetailsCard seller={seller} />

        <ChangePasswordCard sellerId={seller.id} />

        <div className="rounded-xl border-2 border-status-error bg-red-50 p-5">
          <p className="mb-4 text-sm font-semibold text-status-error">Danger Zone</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuspend(true)}
            >
              {seller.status === 'suspended' ? 'Activate Seller' : 'Suspend Seller'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete Seller
            </Button>
          </div>
        </div>
      </div>

      <SuspendDialog
        targetId={showSuspend ? seller.id : null}
        targetName={seller.name}
        targetType="seller"
        currentStatus={seller.status}
        onClose={() => setShowSuspend(false)}
        invalidateKey={['admin-sellers', seller.id.toString()]}
      />
      <DeleteDialog
        targetId={showDelete ? seller.id : null}
        targetName={seller.name}
        targetType="seller"
        onClose={() => setShowDelete(false)}
        onDeleted={() => router.push('/admin/sellers')}
        invalidateKey={['admin-sellers']}
      />
    </>
  )
}
