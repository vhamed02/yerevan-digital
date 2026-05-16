import { Palette, CreditCard, LayoutDashboard, Package, Globe, Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

const FEATURES = [
  {
    key: 'templates',
    Icon: Palette,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'group-hover:border-violet-200',
    span: 'md:col-span-2',
  },
  {
    key: 'payments',
    Icon: CreditCard,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    accent: 'group-hover:border-green-200',
    span: '',
  },
  {
    key: 'dashboard',
    Icon: LayoutDashboard,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    accent: 'group-hover:border-sky-200',
    span: '',
  },
  {
    key: 'products',
    Icon: Package,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    accent: 'group-hover:border-orange-200',
    span: 'md:col-span-2',
  },
  {
    key: 'multilang',
    Icon: Globe,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    accent: 'group-hover:border-pink-200',
    span: '',
  },
  {
    key: 'custom',
    Icon: Link2,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    accent: 'group-hover:border-brand-200',
    span: '',
  },
] as const

export default function FeaturesSection() {
  const t = useTranslations('features')

  return (
    <section className="bg-surface-secondary py-24">
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
          {FEATURES.map(({ key, Icon, iconBg, iconColor, accent, span }) => (
            <div
              key={key}
              className={`group flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:shadow-md ${accent} ${span}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex flex-col gap-1.5">
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
