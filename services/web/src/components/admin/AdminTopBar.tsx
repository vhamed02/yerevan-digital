'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Bell, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAuthStore from '@/stores/auth.store'

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/sellers': 'Sellers',
  '/admin/stores': 'Stores',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/templates': 'Templates',
  '/admin/payments': 'Payments',
  '/admin/settings': 'Settings',
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = [{ label: 'Admin', href: '/admin' }]

  let current = ''
  for (const part of parts) {
    current += '/' + part
    const label = routeLabels[current]
    if (label && current !== '/admin') {
      crumbs.push({ label, href: current })
    } else if (!label && parts.indexOf(part) > 1) {
      crumbs.push({ label: part, href: current })
    }
  }
  return crumbs
}

interface AdminTopBarProps {
  onMenuClick: () => void
}

export default function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const crumbs = useBreadcrumbs()
  const { user } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-content-muted" />}
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-content-primary">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-content-muted hover:text-content-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn('relative', searchOpen ? 'flex' : 'hidden sm:flex')}>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
          <input
            type="search"
            placeholder="Search..."
            className="h-8 w-48 rounded-md border border-border bg-surface-secondary pl-8 pr-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
            onBlur={() => setSearchOpen(false)}
          />
        </div>

        <button
          className="sm:hidden rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          className="relative rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-status-error" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
