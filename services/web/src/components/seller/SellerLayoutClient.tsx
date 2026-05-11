'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SellerTopNav, { SellerMobileNav } from './SellerTopNav'
import StoreSetupWizard from './StoreSetupWizard'
import useAuthStore from '@/stores/auth.store'
import type { PublicCategory } from '@/types'

interface SellerLayoutClientProps {
  children: React.ReactNode
  categories: PublicCategory[]
}

export default function SellerLayoutClient({ children, categories }: SellerLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, sellerStore } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user || user.role !== 'seller') {
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
