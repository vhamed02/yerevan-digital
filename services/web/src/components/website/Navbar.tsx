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
  const ta = useTranslations('account')
  const { isAuthenticated, user, logout } = useAuthStore()

  const isCustomer = user?.role === 'customer'
  const dashboardHref = user?.role === 'super_admin' ? '/admin' : isCustomer ? '/account/orders' : '/seller'
  const dashboardLabel = isCustomer ? ta('myOrders') : t('dashboard')

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Yerevan Digital" width={32} height={32} className="h-8 w-8" />
          <span className="font-logo text-2xl leading-none text-content-primary tracking-wide">Երևան Դիջիթալ</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/stores"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {t('stores')}
          </Link>
          <Link
            href="/blog"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {t('blog')}
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
          <Link
            href="/track"
            className="rounded-md px-3 py-2 text-sm font-medium text-content-primary/65 hover:bg-surface-secondary hover:text-content-primary transition-colors"
          >
            {ta('track.nav')}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref}>
                <Button size="sm" variant="ghost">{dashboardLabel}</Button>
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
              href="/blog"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary"
              onClick={() => setMobileOpen(false)}
            >
              {t('blog')}
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
            <Link
              href="/track"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary hover:text-content-primary"
              onClick={() => setMobileOpen(false)}
            >
              {ta('track.nav')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link href={dashboardHref} className="rounded-md px-3 py-2.5 text-sm font-medium text-content-primary/70 hover:bg-surface-secondary" onClick={() => setMobileOpen(false)}>
                  {dashboardLabel}
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
