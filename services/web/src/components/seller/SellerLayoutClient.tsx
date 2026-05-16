'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SellerTopNav, { SellerMobileNav } from './SellerTopNav'
import StoreSetupWizard from './StoreSetupWizard'
import useAuthStore from '@/stores/auth.store'
import api from '@/lib/api'
import type { PublicCategory, Store } from '@/types'

interface SellerLayoutClientProps {
  children: React.ReactNode
  categories: PublicCategory[]
}

export default function SellerLayoutClient({ children, categories }: SellerLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [storeChecked, setStoreChecked] = useState(false)
  const { user, isAuthenticated, sellerStore, updateStore, _hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.replace('/auth/login')
      return
    }
    if (sellerStore) {
      setStoreChecked(true)
      return
    }
    // sellerStore is null in localStorage — verify against the API in case
    // the store was created but the client state wasn't updated
    api.get<Store>('/seller/store').then((res) => {
      if (res.data?.id) updateStore(res.data)
    }).catch(() => {
      // 404 = store genuinely doesn't exist yet, show wizard
    }).finally(() => {
      setStoreChecked(true)
    })
  }, [_hasHydrated, isAuthenticated, user, sellerStore, updateStore, router])

  if (!_hasHydrated || !isAuthenticated || !user || user.role !== 'seller' || !storeChecked) {
    return null
  }

  if (!sellerStore) {
    return <StoreSetupWizard categories={categories} />
  }

  return (
    <>
      <SellerTopNav onMenuClick={() => setMobileOpen(true)} />
      <SellerMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen bg-surface-secondary pt-16">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  )
}
