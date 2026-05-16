'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'
import useAuthStore from '@/stores/auth.store'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated || !user || user.role !== 'super_admin') {
      router.replace('/auth/login')
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  if (!_hasHydrated || !isAuthenticated || !user || user.role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-surface-secondary lg:mr-60">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
