import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import PostCard from '@/components/website/PostCard'
import { serverGet } from '@/lib/server-api'
import type { PaginatedResponse, PublicPostListItem } from '@/types'

export default async function LatestPosts() {
  const locale = await getLocale()
  const t = await getTranslations('blog')

  const posts = await serverGet<PaginatedResponse<PublicPostListItem>>('/posts?per_page=3', {
    next: { revalidate: 300 },
  })

  const items = posts?.data ?? []
  if (items.length === 0) return null

  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold text-content-primary sm:text-3xl">
            {t('fromBlog')}
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            {t('viewAll')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <PostCard key={post.slug} post={post} locale={locale} readMoreLabel={t('readMore')} />
          ))}
        </div>
      </div>
    </section>
  )
}
