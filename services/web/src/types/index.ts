export interface User {
  id: number
  name: string
  email: string
  role: 'super-admin' | 'seller'
  avatar?: string
}

export interface Store {
  id: number
  name: string
  slug: string
  status: 'pending' | 'active' | 'suspended'
  logo?: string
  description?: string
  template_id?: number
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id?: number
}

export interface Product {
  uuid: string
  name: string
  slug: string
  price: number
  stock: number
  status: 'draft' | 'active' | 'archived'
  category?: Category
  images: ProductImage[]
  variants?: Variant[]
  description?: string
}

export interface ProductImage {
  uuid: string
  original: string
  thumbnail: string
  medium: string
  large: string
}

export interface Variant {
  id: number
  name: string
  value: string
  price_modifier: number
  stock: number
}

export interface Order {
  uuid: string
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: number
  product: Product
  variant?: Variant
  quantity: number
  price: number
}

export interface CartItem {
  productId: string
  productName: string
  productSlug: string
  variantId?: number
  variantName?: string
  price: number
  quantity: number
  image?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
