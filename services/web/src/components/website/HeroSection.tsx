import { Link } from '@/i18n/navigation'
import { ArrowRight, Check, TrendingUp, ShoppingBag, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Gradient blob behind right content */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[700px] w-[700px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, #eef2ff 0%, #f5f3ff 40%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #eef2ff 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:gap-20 lg:px-8 lg:py-28">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          <div className="inline-flex self-center items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 lg:self-start">
            <span className="text-base">🇦🇲</span>
            {t('badge')}
          </div>

          <div className="flex flex-col gap-5">
            <h1 className="font-heading text-5xl font-extrabold leading-[1.08] tracking-tight text-content-primary sm:text-6xl lg:text-[4.25rem]">
              {t('title')}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)' }}
              >
                {t('title_highlight')}
              </span>
              <br />
              {t('title_end')}
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-content-primary/55 sm:mx-auto lg:mx-0">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/auth/register">
              <Button size="lg" className="group w-full gap-2 sm:w-auto">
                {t('cta_primary')}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/stores">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('cta_secondary')}
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 lg:justify-start">
            {[t('trust_free'), t('trust_no_card'), t('trust_fast')].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-content-primary/45">
                <Check className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right column — product UI */}
        <div className="relative flex flex-1 items-center justify-center">
          <HeroMockup
            storesLabel={t('badge_stores')}
            productsLabel={t('badge_products')}
            revenueLabel={t('badge_revenue')}
          />
        </div>
      </div>
    </section>
  )
}

function HeroMockup({
  storesLabel,
  productsLabel,
  revenueLabel,
}: {
  storesLabel: string
  productsLabel: string
  revenueLabel: string
}) {
  return (
    <div className="relative w-full max-w-[460px]">
      {/* Main store card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-2xl shadow-brand-100/80">
        {/* Browser bar */}
        <div className="flex items-center gap-3 border-b border-border bg-surface-secondary px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-yellow-300" />
            <span className="h-3 w-3 rounded-full bg-green-300" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs text-content-primary/40">vendora.shop/armine-boutique</span>
          </div>
        </div>

        {/* Store header banner */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-r from-brand-500 to-violet-500">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-5 pb-3 pt-0">
            <div className="flex h-12 w-12 -mb-5 items-center justify-center rounded-xl border-2 border-white bg-white text-lg font-bold text-brand-600 shadow-md">
              Ա
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-8">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-content-primary">Armine&apos;s Boutique</h3>
              <p className="text-xs text-content-primary/40">vendora.shop/armine</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Active
            </span>
          </div>

          {/* Product grid */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { emoji: '👗', name: 'Silk Dress', price: '12,500 ֏', bg: 'bg-pink-50', badge: 'New' },
              { emoji: '👕', name: 'Linen Top', price: '8,900 ֏', bg: 'bg-sky-50', badge: null },
              { emoji: '🧣', name: 'Wool Scarf', price: '6,500 ֏', bg: 'bg-amber-50', badge: 'Hot' },
            ].map((p) => (
              <div key={p.name} className="group relative overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                {p.badge && (
                  <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {p.badge}
                  </span>
                )}
                <div className={`flex h-16 items-center justify-center ${p.bg} text-2xl`}>
                  {p.emoji}
                </div>
                <div className="p-2">
                  <p className="truncate text-[10px] font-medium text-content-primary">{p.name}</p>
                  <p className="text-[10px] font-bold text-brand-600">{p.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini revenue chart */}
          <div className="mt-4 rounded-xl border border-border p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-content-primary">Weekly Sales</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +24%
              </span>
            </div>
            <div className="flex h-10 items-end gap-1">
              {[35, 58, 44, 72, 50, 88, 65].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm transition-all ${i === 5 ? 'bg-brand-500' : 'bg-brand-100'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className={`flex-1 text-center text-[9px] ${i === 5 ? 'font-bold text-brand-500' : 'text-content-primary/30'}`}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat: stores */}
      <div className="absolute -left-6 top-16 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
          <ShoppingBag className="h-4 w-4 text-brand-600" />
        </div>
        <div>
          <p className="text-xs text-content-primary/45">Total Stores</p>
          <p className="text-sm font-bold text-content-primary">{storesLabel}</p>
        </div>
      </div>

      {/* Floating stat: products */}
      <div className="absolute -right-6 top-1/3 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
          <Star className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <p className="text-xs text-content-primary/45">Products</p>
          <p className="text-sm font-bold text-content-primary">{productsLabel}</p>
        </div>
      </div>

      {/* Floating revenue */}
      <div className="absolute -right-4 bottom-8 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-content-primary/45">This month</p>
          <p className="text-sm font-bold text-content-primary">{revenueLabel}</p>
        </div>
      </div>
    </div>
  )
}
