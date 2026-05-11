const steps = [
  {
    number: '01',
    icon: '🏪',
    title: 'Register & Create Store',
    description: 'Fill a simple form, pick your store URL, and get started in under 2 minutes.',
  },
  {
    number: '02',
    icon: '📦',
    title: 'Add Your Products',
    description: 'Upload photos, set prices in AMD ֏, organize by categories.',
  },
  {
    number: '03',
    icon: '💸',
    title: 'Start Selling',
    description: 'Share your store link, receive orders, and get paid via Idram.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-content-secondary">Three simple steps to launch your store</p>
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
