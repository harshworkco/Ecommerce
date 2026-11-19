export type User = {
  id: number
  name: string
  email: string
  role: string
  loyalty_points?: number
  phone?: string | null
  address?: string | null
  created_at?: string
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  discount_price: number | null
  stock: number
  sku: string | null
  image_url: string | null
  images: string[] | null
  is_featured: boolean
  is_active: boolean
  weight: string | null
  dimensions: Record<string, number> | string | null
  category_id: number | null
  category_name: string | null
  category_slug: string | null
  created_at: string
  updated_at: string
  average_rating?: number
  review_count?: number
  reviews?: Review[]
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  image_url?: string | null
  product_count?: number
  created_at: string
}

export type CartItem = {
  id: number
  product_id: number
  quantity: number
  created_at: string
  name: string
  price: number
  discount_price: number | null
  stock: number
  image_url: string | null
  slug: string
  unit_price: number
  total_price: number
  in_stock: boolean
  available_quantity: number
}

export type Order = {
  id: number
  user_id: number
  order_number: string
  total: number
  subtotal: number
  tax: number
  shipping_cost: number
  discount_amount: number
  loyalty_points_used: number
  shipping_address: string
  billing_address: string | null
  payment_method: string
  notes: string | null
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  total: number
}

export type Review = {
  id: number
  product_id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: string
  user_name: string
}

export type FlashSale = {
  id: number
  product_id: number
  discount_percent: number
  start_date: string
  end_date: string
  max_quantity_per_user: number
  is_active: boolean
  name: string
  price: number | string
  image_url: string | null
  slug: string
  sale_price: number | string
}

export type LoyaltyProfile = {
  user_id: number
  loyalty_points: number
  tier: string
}

export type LoyaltyTransaction = {
  id: number
  user_id: number
  type: string
  points: number
  description: string | null
  order_id: number | null
  created_at: string
}

export type Reward = {
  id: number
  name: string
  description: string | null
  points_required: number
  discount_amount: number | null
  discount_percent: number | null
  is_active: boolean
}

export type ApiResponse<T = unknown> = T & {
  message?: string
  data?: T
  products?: Product[]
  product?: Product
  categories?: Category[]
  category?: Category
  items?: CartItem[]
  item_count?: number
  total?: number
  user?: User
  token?: string
  orders?: Order[]
  order?: Order
  transactions?: LoyaltyTransaction[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  flash_sales?: FlashSale[]
  loyalty_profile?: LoyaltyProfile
  loyalty_transactions?: LoyaltyTransaction[]
  rewards?: Reward[]
}

export type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
  fetchProfile: () => Promise<void>
}
