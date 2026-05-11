'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Store as StoreIcon,
  ChevronDown,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Palette,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import useAuthStore from '@/stores/auth.store'

const navItems = [
  { href: '/seller', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/seller/products', label: 'Products', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/seller/payments', label: 'Payments', icon: CreditCard },
  { href: '/seller/store/design', label: 'Design', icon: Palette },
  { href: '/seller/store', label: 'Settings', icon: Settings },
]

interface SellerTopNavProps {
  onMenuClick: () => void
}

export default function SellerTopNav({ onMenuClick }: SellerTopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, sellerStore, logout } = useAuthStore()

  function isActive(item: (typeof navItems)[number]) {
    if (item.exact) return pathname === item.href
    if (item.href === '/seller/store' && pathname.startsWith('/seller/store/design')) return false
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function handleLogout() {
    logout()
    router.push('/auth/login')
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-4 lg:gap-6">
        <Link href="/seller" className="flex items-center gap-2 font-heading text-base font-bold text-content-primary">
          <StoreIcon className="h-5 w-5 text-brand-500" />
          <span className="hidden sm:inline">VENDORA</span>
        </Link>

        {sellerStore && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-content-primary hover:bg-surface-secondary transition-colors">
              <span className="max-w-[120px] truncate">{sellerStore.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-content-muted" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-lg"
                sideOffset={6}
              >
                <DropdownMenu.Item className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none">
                  <span className="font-medium">{sellerStore.name}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      <nav className="mx-4 hidden flex-1 items-center gap-1 lg:flex">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                  : 'text-content-muted hover:text-content-primary'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[160px] rounded-lg border border-border bg-surface p-1 shadow-lg"
              align="end"
              sideOffset={6}
            >
              <DropdownMenu.Label className="px-3 py-2 text-xs text-content-muted">
                {user?.name}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/seller/store"
                  className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                >
                  <User className="h-3.5 w-3.5" />
                  Profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-status-error hover:bg-red-50 outline-none"
                onSelect={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          className="rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors lg:hidden"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

interface SellerMobileNavProps {
  open: boolean
  onClose: () => void
}

export function SellerMobileNav({ open, onClose }: SellerMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, sellerStore, logout } = useAuthStore()

  function isActive(item: (typeof navItems)[number]) {
    if (item.exact) return pathname === item.href
    if (item.href === '/seller/store' && pathname.startsWith('/seller/store/design')) return false
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  function handleLogout() {
    logout()
    router.push('/auth/login')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-brand-500" />
            <span className="font-heading font-bold text-content-primary">VENDORA</span>
          </div>
          <button
            className="rounded p-1 text-content-muted hover:text-content-primary"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {sellerStore && (
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-content-muted">Current store</p>
            <p className="text-sm font-medium text-content-primary">{sellerStore.name}</p>
          </div>
        )}
        <nav className="flex flex-col gap-1 px-3 py-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item)
                  ? 'bg-brand-500 text-white'
                  : 'text-content-primary hover:bg-surface-secondary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-status-error hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
