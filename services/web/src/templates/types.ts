import type { StorefrontStore, StorefrontProduct, StorefrontVariant, PublicCategory } from '@/types'

export interface StoreHeaderProps {
  store: StorefrontStore
  categories: PublicCategory[]
  slug: string
  isPreview?: boolean
}

export interface StoreFooterProps {
  store: StorefrontStore
}

export interface StoreHomeProps {
  store: StorefrontStore
  featuredProducts: StorefrontProduct[]
  products: StorefrontProduct[]
  categories: PublicCategory[]
  slug: string
  isPreview?: boolean
}

export interface ProductGridProps {
  products: StorefrontProduct[]
  storeSlug: string
  isPreview?: boolean
}

export interface ProductCardProps {
  product: StorefrontProduct
  storeSlug: string
  isPreview?: boolean
}

export interface ProductDetailProps {
  product: StorefrontProduct
  storeSlug: string
  isPreview?: boolean
}

export interface CartDrawerProps {
  open: boolean
  onClose: () => void
  storeSlug: string
}

export interface CheckoutFormProps {
  storeSlug: string
}

export type { StorefrontProduct, StorefrontVariant, StorefrontStore, PublicCategory }
