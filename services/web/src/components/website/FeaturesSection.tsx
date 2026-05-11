const features = [
  {
    icon: '🎨',
    title: 'Beautiful Templates',
    description: 'Switch your store design anytime, no coding required. Multiple themes to match your brand.',
  },
  {
    icon: '💳',
    title: 'Armenian Payments',
    description: 'Accept Idram and local bank payments. Built for Armenian businesses from day one.',
  },
  {
    icon: '📊',
    title: 'Simple Dashboard',
    description: 'Track orders, revenue, and products with a clean, easy-to-use dashboard.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="bg-surface-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">
            Everything you need to sell online
          </h2>
          <p className="mt-3 text-content-secondary">Built specifically for Armenian entrepreneurs</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-4xl" aria-hidden="true">{feature.icon}</span>
              <div className="flex flex-col gap-2">
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
