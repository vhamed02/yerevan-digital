'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import useAuthStore from '@/stores/auth.store'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const t = useTranslations('nav')
  const { isAuthenticated, user, logout } = useAuthStore()

  const dashboardHref = user?.role === 'super_admin' ? '/admin' : '/seller'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled
          ? 'border-b border-border bg-white/95 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-white'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <svg className="h-4 w-4 text-white" viewBox="19.8 42.8 360.4 254.7" fill="currentColor" aria-hidden="true">
              <polygon points="35.8,58.8 82.6,58.8 181.2,281.5 133.3,281.5" />
              <polygon points="119.7,58.8 168,58.8 198.8,129.8 231,58.8 278.6,58.8 224,184 241.7,226.5 316.1,58.8 364.2,58.8 265.5,281.5 217.9,281.5" />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-content-primary tracking-tight">Vendorex</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/stores"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {t('stores')}
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {t('about')}
          </Link>
          <Link
            href="/contact"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {t('contact')}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref}>
                <Button size="sm" variant="ghost">{t('dashboard')}</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={logout}>{t('logout')}</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">{t('login')}</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">{t('register')}</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary transition-colors md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/stores"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary"
              onClick={() => setMobileOpen(false)}
            >
              {t('stores')}
            </Link>
            <Link
              href="/about"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary"
              onClick={() => setMobileOpen(false)}
            >
              {t('about')}
            </Link>
            <Link
              href="/contact"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary"
              onClick={() => setMobileOpen(false)}
            >
              {t('contact')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link href={dashboardHref} className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary" onClick={() => setMobileOpen(false)}>
                  {t('dashboard')}
                </Link>
                <button className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-content-primary/70 hover:bg-surface-secondary" onClick={() => { logout(); setMobileOpen(false) }}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary" onClick={() => setMobileOpen(false)}>
                  {t('login')}
                </Link>
                <Link href="/auth/register" className="rounded-md px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
                  {t('register')}
                </Link>
              </>
            )}
            <div className="px-3 pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
