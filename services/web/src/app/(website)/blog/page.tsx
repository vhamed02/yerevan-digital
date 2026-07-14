import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import PostCard from '@/components/website/PostCard'
import { serverGet } from '@/lib/server-api'
import { localizedAlternates, ogLocale } from '@/lib/seo'
import type { PaginatedResponse, PublicPostListItem } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('blog')
  const og = ogLocale(locale)

  return {
    title: `${t('title')} — Yerevan Digital`,
    description: t('subtitle'),
    alternates: {
      ...localizedAlternates('/blog', locale),
      types: { 'application/rss+xml': '/blog/rss.xml' },
    },
    openGraph: {
      title: `${t('title')} — Yerevan Digital`,
      description: t('subtitle'),
      locale: og.locale,
      alternateLocale: og.alternateLocale,
    },
  }
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { page = '1' } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('blog')

  const posts = await serverGet<PaginatedResponse<PublicPostListItem>>(
    `/posts?page=${encodeURIComponent(page)}&per_page=9`,
    { next: { revalidate: 300 } }
  )

  const items = posts?.data ?? []
  const meta = posts?.meta
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-content-primary sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-content-secondary">{t('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border text-content-muted">
          {t('empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <PostCard key={post.slug} post={post} locale={locale} readMoreLabel={t('readMore')} />
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              ← {t('previous')}
            </Link>
          )}
          <span className="text-sm text-content-muted">
            {currentPage} / {lastPage}
          </span>
          {currentPage < lastPage && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              {t('next')} →
            </Link>
          )}
        </nav>
      )}
    </main>
  )
}
