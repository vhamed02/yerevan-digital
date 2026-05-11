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

export interface MultiLang {
  hy: string
  en: string
}

export interface PublicCategory {
  id: number
  name: MultiLang
  slug: string
}

export interface PublicStore {
  id: number
  name: MultiLang
  slug: string
  status: string
  banner_url?: string | null
  logo_url?: string | null
  category?: PublicCategory | null
  product_count: number
}

export interface PlatformStats {
  stores_count: number
  products_count: number
  orders_count: number
}

export interface AdminSeller {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  status: 'active' | 'suspended'
  store_count: number
  product_count: number
  total_revenue: number
  joined_at: string
  last_login_at?: string
  store?: AdminStore
}

export interface AdminStore {
  id: number
  name: MultiLang
  slug: string
  status: 'pending' | 'active' | 'suspended'
  is_featured: boolean
  logo_url?: string
  banner_url?: string
  description?: MultiLang
  seller: AdminSeller
  template?: AdminTemplate
  category?: PublicCategory
  product_count: number
  order_count: number
  revenue: number
  payment_gateways: AdminPaymentGateway[]
  created_at: string
  registered_days_ago?: number
}

export interface AdminCategory {
  id: number
  name: MultiLang
  slug: string
  icon?: string
  parent_id?: number
  sort_order: number
  is_active: boolean
  product_count: number
  children?: AdminCategory[]
}

export interface AdminTemplate {
  id: number
  name: string
  description?: string
  preview_url?: string
  store_count: number
  is_active: boolean
}

export interface AdminPaymentGateway {
  id: number
  key: string
  name: MultiLang
  instructions?: MultiLang
  required_fields?: string
  is_platform_active: boolean
  active_store_count: number
}

export interface AdminSettings {
  platform_name: string
  platform_name_hy: string
  registration_enabled: boolean
  registration_require_approval: boolean
  support_email: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}

export interface AdminDashboardStats {
  total_sellers: number
  sellers_this_month: number
  active_stores: number
  stores_this_month: number
  orders_today: number
  orders_change_pct: number
  revenue_this_month: number
  revenue_change_pct: number
}

export interface AdminOrderChartPoint {
  date: string
  count: number
}

export interface AdminOrderStatusPoint {
  status: string
  count: number
}

export interface AdminOrder {
  uuid: string
  order_number: string
  store_name: string
  customer_name: string
  amount: number
  status: string
  created_at: string
}

export interface AdminDashboardData {
  stats: AdminDashboardStats
  orders_chart: AdminOrderChartPoint[]
  orders_by_status: AdminOrderStatusPoint[]
  pending_stores: AdminStore[]
  recent_orders: AdminOrder[]
}
