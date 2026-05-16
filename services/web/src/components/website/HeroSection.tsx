import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-surface-dark">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-4 py-24 sm:px-6 lg:flex-row lg:gap-16 lg:px-8">
        {/* Left: Copy */}
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          <div className="inline-flex self-center items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 lg:self-start">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            {t('badge')}
          </div>

          <h1 className="font-heading text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]">
            {t('title')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)' }}
            >
              {t('title_highlight')}
            </span>
            <br />
            {t('title_end')}
          </h1>

          <p className="text-lg leading-relaxed text-white/55 lg:max-w-md">
            {t('subtitle')}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="group w-full bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 sm:w-auto"
              >
                {t('cta_primary')}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/stores">
              <Button
                size="lg"
                variant="ghost"
                className="w-full border border-white/10 text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white sm:w-auto"
              >
                {t('cta_secondary')}
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 lg:justify-start">
            {[t('trust_free'), t('trust_no_card'), t('trust_fast')].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-white/35">
                <Check className="h-3.5 w-3.5 text-brand-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Store UI mockup */}
        <div className="relative flex flex-1 items-center justify-center">
          <StoreMockup
            storesLabel={t('badge_stores')}
            productsLabel={t('badge_products')}
            revenueLabel={t('badge_revenue')}
          />
        </div>
      </div>
    </section>
  )
}

function StoreMockup({
  storesLabel,
  productsLabel,
  revenueLabel,
}: {
  storesLabel: string
  productsLabel: string
  revenueLabel: string
}) {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* Glow behind card */}
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-3xl" />

      {/* Main browser window */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-2xl backdrop-blur-sm">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 rounded-t-xl bg-white/[0.05] px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/50" />
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white/[0.05] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-green-400/60" />
            <span className="text-[11px] text-white/25">vendora.shop/armine-boutique</span>
          </div>
        </div>

        {/* Store content */}
        <div className="rounded-b-xl bg-[#0d1117] p-4">
          {/* Store header */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-600/30 to-violet-600/20 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/30 text-base font-bold text-white">
                Ա
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Armine&apos;s Boutique</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-green-400">Active</span>
                </div>
              </div>
            </div>
            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/60">
              Edit Store
            </span>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Silk Dress', price: '12,500 ֏', hue: 'from-pink-500/30 to-rose-600/20' },
              { label: 'Linen Top', price: '8,900 ֏', hue: 'from-sky-500/30 to-blue-600/20' },
              { label: 'Wool Scarf', price: '6,500 ֏', hue: 'from-amber-500/30 to-orange-600/20' },
            ].map((p) => (
              <div key={p.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                <div className={`mb-2 flex h-14 items-center justify-center rounded-lg bg-gradient-to-br ${p.hue}`}>
                  <span className="text-xl">👗</span>
                </div>
                <p className="truncate text-[10px] font-medium text-white/60">{p.label}</p>
                <p className="text-[10px] font-bold text-brand-400">{p.price}</p>
              </div>
            ))}
          </div>

          {/* Mini chart bar */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/40">Sales this week</span>
              <span className="text-[10px] font-semibold text-green-400">↑ 24%</span>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[30, 55, 40, 70, 45, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-brand-500/40"
                  style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.5 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -right-4 -top-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface-dark/90 px-3 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
        <span>🏪</span>
        <span className="text-white/70">{storesLabel}</span>
      </div>
      <div className="absolute -left-4 top-1/3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface-dark/90 px-3 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
        <span>📦</span>
        <span className="text-white/70">{productsLabel}</span>
      </div>
      <div className="absolute -right-3 bottom-12 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface-dark/90 px-3 py-2.5 shadow-xl backdrop-blur-md">
        <span className="text-base">💰</span>
        <div>
          <p className="text-[10px] text-white/40">Revenue</p>
          <p className="text-xs font-bold text-white">{revenueLabel}</p>
        </div>
      </div>
    </div>
  )
}
