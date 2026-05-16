'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Tag,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  Store as StoreIcon,
  X,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useAuthStore from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/sellers', label: 'Sellers', icon: Users },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/templates', label: 'Templates', icon: Palette },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface AdminSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/auth/login')
  }

  function isActive(item: (typeof navItems)[number]) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  const content = (
    <div className="flex h-full w-60 flex-col bg-surface-dark text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-brand-500" />
          <div>
            <p className="font-heading text-sm font-bold leading-tight">VENDORA</p>
            <p className="text-[11px] text-white/50">Admin</p>
          </div>
        </div>
        <button
          className="lg:hidden rounded p-1 text-white/60 hover:text-white"
          onClick={onMobileClose}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name ?? 'Super Admin'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-l-[3px] border-white bg-brand-500 pl-[9px] text-white'
                      : 'border-l-[3px] border-transparent text-white/70 pl-[9px] hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden lg:block">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="absolute bottom-0 left-0 top-0">{content}</aside>
        </div>
      )}
    </>
  )
}
