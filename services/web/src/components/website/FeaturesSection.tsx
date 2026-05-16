import { Palette, CreditCard, LayoutDashboard, Package, Globe, Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

const FEATURE_ICONS = [
  { Icon: Palette, gradient: 'from-violet-500/20 to-purple-600/20', border: 'border-violet-500/20', color: 'text-violet-400' },
  { Icon: CreditCard, gradient: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/20', color: 'text-green-400' },
  { Icon: LayoutDashboard, gradient: 'from-sky-500/20 to-blue-600/20', border: 'border-sky-500/20', color: 'text-sky-400' },
  { Icon: Package, gradient: 'from-orange-500/20 to-amber-600/20', border: 'border-orange-500/20', color: 'text-orange-400' },
  { Icon: Globe, gradient: 'from-pink-500/20 to-rose-600/20', border: 'border-pink-500/20', color: 'text-pink-400' },
  { Icon: Link2, gradient: 'from-brand-500/20 to-indigo-600/20', border: 'border-brand-500/20', color: 'text-brand-400' },
]

export default function FeaturesSection() {
  const t = useTranslations('features')

  const features = [
    { key: 'templates', ...FEATURE_ICONS[0] },
    { key: 'payments', ...FEATURE_ICONS[1] },
    { key: 'dashboard', ...FEATURE_ICONS[2] },
    { key: 'products', ...FEATURE_ICONS[3] },
    { key: 'multilang', ...FEATURE_ICONS[4] },
    { key: 'custom', ...FEATURE_ICONS[5] },
  ]

  return (
    <section className="bg-surface-dark py-24">
      {/* Subtle separator glow */}
      <div className="mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
            {t('label')}
          </span>
        </div>
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('heading')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-white/45">
          {t('subheading')}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, Icon, gradient, border, color }) => (
            <div
              key={key}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              {/* Corner glow on hover */}
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100`} />

              <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${gradient} ${border}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-base font-semibold text-white">
                  {t(`${key}_title` as any)}
                </h3>
                <p className="text-sm leading-relaxed text-white/45">
                  {t(`${key}_desc` as any)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
