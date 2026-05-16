import { useTranslations } from 'next-intl'

export default function HowItWorks() {
  const t = useTranslations('howItWorks')

  const steps = [
    {
      number: '01',
      icon: '🏪',
      title: t('step1_title'),
      description: t('step1_desc'),
    },
    {
      number: '02',
      icon: '📦',
      title: t('step2_title'),
      description: t('step2_desc'),
    },
    {
      number: '03',
      icon: '💸',
      title: t('step3_title'),
      description: t('step3_desc'),
    },
  ]

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">{t('heading')}</h2>
          <p className="mt-3 text-content-secondary">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-bold text-brand-600">
                  {step.number}
                </div>
                <span className="text-2xl" aria-hidden="true">{step.icon}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-lg font-semibold text-content-primary">{step.title}</h3>
                <p className="text-sm text-content-secondary">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
