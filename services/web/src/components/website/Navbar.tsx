'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import useAuthStore from '@/stores/auth.store'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('nav')
  const { isAuthenticated, user, logout } = useAuthStore()

  const dashboardHref = user?.role === 'super-admin' ? '/admin' : '/seller'

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-700/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold text-white">
          <Store className="h-6 w-6" />
          Vendora
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/stores" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            {t('stores')}
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher className="border-white/20" />
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref}>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                  {t('dashboard')}
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={logout}>
                {t('logout')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-white text-brand-700 hover:bg-white/90">
                  {t('register')}
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-brand-700 px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/stores"
              className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {t('stores')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <button
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => { logout(); setMobileOpen(false) }}
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('register')}
                </Link>
              </>
            )}
            <div className="px-3 pt-2">
              <LanguageSwitcher className="border-white/20" />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
