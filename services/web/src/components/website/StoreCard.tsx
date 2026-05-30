'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { pickLang } from '@/lib/i18n'
import type { PublicStore } from '@/types'

const DEFAULT_BANNER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRThFQUYwIi8+PC9zdmc+'

interface StoreCardProps {
  store: PublicStore
}

export default function StoreCard({ store }: StoreCardProps) {
  const locale = useLocale()
  const name = pickLang(store.name, locale)
  const categoryName = pickLang(store.category?.name, locale)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/7] overflow-hidden">
        <Image
          src={store.banner_url || DEFAULT_BANNER}
          fill
          alt=""
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute -bottom-6 left-4">
          <Avatar src={store.logo_url} name={name} size="lg" className="ring-2 ring-surface" />
        </div>
      </div>

      <div className="px-4 pb-4 pt-8">
        <h3 className="font-heading font-semibold text-content-primary">{name}</h3>
        {categoryName && (
          <p className="mt-0.5 text-sm text-content-muted">{categoryName}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline">{store.product_count} products</Badge>
        </div>
        <Link href={`/store/${store.slug}`} className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full">
            Visit Store →
          </Button>
        </Link>
      </div>
    </div>
  )
}
