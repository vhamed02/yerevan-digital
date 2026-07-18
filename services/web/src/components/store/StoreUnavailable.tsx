import { Store, ArrowRight } from 'lucide-react'
import { PLATFORM_HOST } from '@/lib/storeUrl'

/**
 * Shown when a `<slug>.yerevan.digital` address does not map to an active store
 * (never claimed, closed, renamed, or mistyped). Rendered by the storefront
 * not-found boundary with a 404 status.
 */
export function StoreUnavailable({ host }: { host?: string }) {
  const homeUrl = `https://${PLATFORM_HOST}`

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-16">
      <div className="relative w-full max-w-md">
        {/* Soft brand glow behind the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-20 h-48 rounded-full bg-brand-100/70 blur-3xl"
        />

        <div className="relative flex flex-col items-center rounded-2xl border border-border bg-surface px-8 py-12 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 ring-8 ring-brand-50/50">
            <Store className="h-7 w-7 text-brand-600" strokeWidth={1.75} />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-content-muted">
            Store not found
          </p>
          <h1 className="font-heading text-2xl font-bold text-content-primary">
            This store isn&rsquo;t available
          </h1>

          {host && (
            <span className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1.5 font-mono text-xs text-content-muted">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-status-error" />
              <span className="truncate">{host}</span>
            </span>
          )}

          <p className="mt-5 text-sm leading-relaxed text-content-muted">
            We couldn&rsquo;t find an active store at this address. It may have been closed or
            renamed &mdash; or the link might be mistyped.
          </p>

          <a
            href={homeUrl}
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Explore Yerevan Digital
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-content-muted">
          Powered by <span className="font-semibold text-content-primary">Yerevan Digital</span>
        </p>
      </div>
    </main>
  )
}
