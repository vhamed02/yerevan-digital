'use client'

import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Heart, Trash2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api from '@/lib/api'
import { pickLang } from '@/lib/i18n'
import { resetWishlistCache } from '@/hooks/useWishlist'
import type { StorefrontProduct } from '@/types'

interface WishlistEntry {
  saved_at: string
  store_slug: string | null
  product: StorefrontProduct
}

export default function WishlistClient() {
  const t = useTranslations('storefront')
  const locale = useLocale()
  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['customer-wishlist'],
    queryFn: async () => {
      const res = await api.get<WishlistEntry[]>('/customer/wishlist')
      return res.data
    },
  })

  const removeMutation = useMutation({
    mutationFn: (uuid: string) => api.delete(`/customer/wishlist/${uuid}`),
    onSuccess: () => {
      // The card hearts read from a module cache, so it has to be dropped too.
      resetWishlistCache()
      queryClient.invalidateQueries({ queryKey: ['customer-wishlist'] })
      toast.success(t('wishlist.removed'))
    },
    onError: () => toast.error(t('wishlist.failed')),
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-content-primary">
        {t('wishlist.title')}
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState icon={Heart} title={t('wishlist.empty')} description={t('wishlist.emptyHint')} />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((entry) => {
            const name = pickLang(entry.product.name, locale)
            const image = entry.product.images?.[0]

            return (
              <li
                key={entry.product.uuid}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                <Link
                  href={
                    entry.store_slug
                      ? `/store/${entry.store_slug}/products/${entry.product.slug}`
                      : '#'
                  }
                  className="relative block aspect-square bg-surface-secondary"
                >
                  {image ? (
                    <Image src={image.medium} alt={name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-content-muted">
                      <Heart className="h-8 w-8" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link
                    href={
                      entry.store_slug
                        ? `/store/${entry.store_slug}/products/${entry.product.slug}`
                        : '#'
                    }
                    className="line-clamp-2 text-sm font-medium text-content-primary hover:text-brand-500"
                  >
                    {name}
                  </Link>
                  <p className="text-sm font-semibold tabular-nums text-content-primary">
                    {entry.product.price.toLocaleString('hy-AM')} ֏
                  </p>
                  <div className="mt-auto pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={removeMutation.isPending && removeMutation.variables === entry.product.uuid}
                      onClick={() => removeMutation.mutate(entry.product.uuid)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('wishlist.remove')}
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
