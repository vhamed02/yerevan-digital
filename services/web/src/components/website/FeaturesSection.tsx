import { useTranslations } from 'next-intl'

export default function FeaturesSection() {
  const t = useTranslations('features')

  const features = [
    {
      icon: '🎨',
      title: t('templates_title'),
      description: t('templates_desc'),
    },
    {
      icon: '💳',
      title: t('payments_title'),
      description: t('payments_desc'),
    },
    {
      icon: '📊',
      title: t('dashboard_title'),
      description: t('dashboard_desc'),
    },
  ]

  return (
    <section className="bg-surface-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="mt-3 text-content-secondary">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <span className="text-3xl" aria-hidden="true">{feature.icon}</span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-lg font-semibold text-content-primary">{feature.title}</h3>
                <p className="text-sm text-content-secondary">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
