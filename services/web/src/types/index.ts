export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'seller'
  avatar?: string
}

export interface Store {
  id: number
  name: MultiLang
  slug: string
  status: 'pending' | 'active' | 'suspended'
  logo?: string
  description?: MultiLang
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
  images: ProductImage[] | null
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
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  subtotal: number
  discount: number
  shipping_cost: number
  tax: number
  total: number
  currency: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address?: {
    line1?: string
    line2?: string
    city?: string
    postal_code?: string
    country?: string
  }
  notes?: string
  paid_at?: string
  shipped_at?: string
  delivered_at?: string
  items: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: number
  product_name: MultiLang
  variant_name?: MultiLang
  sku?: string
  quantity: number
  unit_price: number
  total_price: number
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
  locale?: string
  avatar?: string
  status: 'active' | 'suspended'
  store_count: number
  product_count: number
  total_revenue: number
  created_at: string
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
  seller?: AdminSeller
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

export interface SellerProduct {
  uuid: string
  name: MultiLang
  slug: string
  description_short?: MultiLang
  description_full?: MultiLang
  price: number
  compare_price?: number
  cost_price?: number
  sku?: string
  manage_stock: boolean
  stock: number
  allow_backorders: boolean
  status: 'draft' | 'active' | 'archived'
  is_featured: boolean
  category?: PublicCategory
  images: ProductImage[] | null
  variants?: SellerVariant[]
  meta_title?: MultiLang
  meta_description?: MultiLang
}

export interface SellerVariant {
  id?: number
  attributes: Record<string, string>
  price: number
  stock: number
  sku?: string
  is_active: boolean
}

export interface SellerDashboardStats {
  total_products: number
  active_products: number
  total_orders: number
  orders_this_month: number
  revenue_this_month: number
  revenue_today: number
}

export interface SellerRevenueChartPoint {
  date: string
  revenue: number
}

export interface SellerDashboardData {
  stats: SellerDashboardStats
  revenue_chart: SellerRevenueChartPoint[]
  orders_by_status: AdminOrderStatusPoint[]
  recent_orders: Order[]
}

export interface SellerStore {
  id: number
  name: MultiLang
  slug: string
  status: 'pending' | 'active' | 'suspended'
  description?: MultiLang
  logo_url?: string
  banner_url?: string
  category_id?: number
  category?: PublicCategory
  phone?: string
  email?: string
  address?: string
  social_instagram?: string
  social_facebook?: string
  meta_title?: MultiLang
  meta_description?: MultiLang
  design?: StoreDesignSettings
  template_id?: number
}

export interface StoreDesignSettings {
  template_id: number
  primary_color: string
  secondary_color: string
  font_pair: string
  products_per_row: number
  show_hero_banner: boolean
  show_categories_bar: boolean
  show_featured_slider: boolean
}

export interface SellerTemplate {
  id: number
  key: string
  name: string
  description?: string
  preview_url?: string
  is_active: boolean
}

export interface StoreGatewayConfig {
  id: number
  payment_gateway_id: number
  key: string
  name: MultiLang
  instructions?: MultiLang
  required_fields?: Array<{ key: string; label_hy: string; label_en: string }>
  is_active: boolean
  is_sandbox: boolean
  config: Record<string, string>
}

export interface StoreTemplateConfig {
  primary_color: string
  secondary_color: string
  font_heading: string
  font_pair?: string
  products_per_row?: number
  show_hero_banner?: boolean
  show_categories_bar?: boolean
  show_featured_slider?: boolean
}

export interface StorefrontStore {
  id: number
  slug: string
  name: MultiLang
  description?: MultiLang
  logo_url?: string | null
  banner_url?: string | null
  phone?: string
  email?: string
  address?: string
  social_instagram?: string
  social_facebook?: string
  meta_title?: MultiLang
  meta_description?: MultiLang
  category?: PublicCategory
  active_template_key: string
  template_config: StoreTemplateConfig
  payment_gateways?: string[]
}

export interface StorefrontVariant {
  id: number
  attributes: Record<string, string>
  price: number
  stock: number
  sku?: string
  is_active: boolean
}

export interface ProductReview {
  id: number
  reviewer_name: string
  rating: number
  body: string | null
  created_at: string
}

export interface StorefrontProduct {
  uuid: string
  slug: string
  name: MultiLang
  description_short?: MultiLang
  description_full?: MultiLang
  price: number
  compare_price?: number
  status: 'active' | 'draft' | 'archived'
  is_featured: boolean
  stock: number
  manage_stock: boolean
  images: ProductImage[] | null
  variants?: StorefrontVariant[]
  category?: PublicCategory
  meta_title?: MultiLang
  meta_description?: MultiLang
  rating_avg?: number | null
  rating_count?: number
  reviews?: ProductReview[]
}

export interface StorefrontOrderItem {
  product_name: MultiLang
  variant_name?: string
  quantity: number
  price: number
}

export interface StorefrontOrder {
  uuid: string
  order_number: string
  status: string
  total: number
  currency: string
  customer_name: string
  customer_email: string
  items: StorefrontOrderItem[]
  created_at: string
}


export interface Page {
  id: number
  slug: string
  title: MultiLang
  content: MultiLang
  meta_title?: MultiLang
  meta_description?: MultiLang
  is_published: boolean
  updated_at: string
}
