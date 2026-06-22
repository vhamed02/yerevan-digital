import { Palette, CreditCard, LayoutDashboard, Package, Globe, Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

const FEATURES = [
  {
    key: 'templates',
    Icon: Palette,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    hoverBorder: 'hover:border-violet-200',
    glow: 'from-violet-50',
    span: 'md:col-span-2',
  },
  {
    key: 'payments',
    Icon: CreditCard,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
    glow: 'from-emerald-50',
    span: '',
  },
  {
    key: 'dashboard',
    Icon: LayoutDashboard,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    hoverBorder: 'hover:border-sky-200',
    glow: 'from-sky-50',
    span: '',
  },
  {
    key: 'products',
    Icon: Package,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    hoverBorder: 'hover:border-orange-200',
    glow: 'from-orange-50',
    span: 'md:col-span-2',
  },
  {
    key: 'multilang',
    Icon: Globe,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    hoverBorder: 'hover:border-pink-200',
    glow: 'from-pink-50',
    span: 'md:col-span-2',
  },
  {
    key: 'custom',
    Icon: Link2,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    hoverBorder: 'hover:border-brand-200',
    glow: 'from-brand-50',
    span: '',
  },
] as const

export default function FeaturesSection() {
  const t = useTranslations('features')

  return (
    <section className="relative bg-surface-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-content-primary/50">
            {t('subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ key, Icon, iconBg, iconColor, hoverBorder, glow, span }) => (
            <div
              key={key}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${hoverBorder} ${span}`}
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${glow}`}
                aria-hidden="true"
              />
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="relative flex flex-col gap-1.5">
                <h3 className="font-heading text-base font-semibold text-content-primary">
                  {t(`${key}_title` as any)}
                </h3>
                <p className="text-sm leading-relaxed text-content-primary/50">
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
