import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Newspaper } from 'lucide-react'
import { pickLang } from '@/lib/i18n'
import { formatPostDate } from '@/lib/blog'
import type { PublicPostListItem } from '@/types'

interface PostCardProps {
  post: PublicPostListItem
  locale: string
  readMoreLabel: string
}

export default function PostCard({ post, locale, readMoreLabel }: PostCardProps) {
  const title = pickLang(post.title, locale)
  const excerpt = pickLang(post.excerpt ?? undefined, locale)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-tertiary">
        {post.cover ? (
          <Image
            src={post.cover.medium}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-500/10 to-brand-700/20">
            <Newspaper className="h-8 w-8 text-brand-500/40" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs text-content-muted">
          {post.published_at ? formatPostDate(post.published_at, locale) : ''}
        </p>
        <h2 className="font-heading text-lg font-bold leading-snug text-content-primary group-hover:text-brand-600">
          {title}
        </h2>
        {excerpt && <p className="line-clamp-2 text-sm text-content-secondary">{excerpt}</p>}
        <span className="mt-auto pt-2 text-sm font-medium text-brand-600">{readMoreLabel} →</span>
      </div>
    </Link>
  )
}
