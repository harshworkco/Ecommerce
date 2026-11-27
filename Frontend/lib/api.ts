import type { Product, Category, CartItem, Order, User, ApiResponse, FlashSale, LoyaltyProfile, LoyaltyTransaction, Reward, Review } from "@/types"

const API_BASE_URL = process.env.API_URL || "http://localhost:5000"

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (includeAuth) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(options.method !== "GET" || options.headers ? true : false),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    return response.json()
  }

  get<T>(endpoint: string, includeAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers: this.getHeaders(includeAuth) })
  }

  post<T>(endpoint: string, body: unknown, includeAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: this.getHeaders(includeAuth),
    })
  }

  put<T>(endpoint: string, body: unknown, includeAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: this.getHeaders(includeAuth),
    })
  }

  delete<T>(endpoint: string, includeAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: this.getHeaders(includeAuth),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeProduct(product: any): Product {
  if (!product) return product
  return {
    ...product,
    price: toNumber(product.price),
    discount_price:
      product.discount_price === null || product.discount_price === undefined
        ? null
        : toNumber(product.discount_price),
    stock: toNumber(product.stock),
    average_rating:
      product.average_rating === undefined ? undefined : toNumber(product.average_rating),
    review_count:
      product.review_count === undefined ? undefined : toNumber(product.review_count),
  }
}

function normalizeCartItem(item: any): CartItem {
  const price = toNumber(item.price)
  const discountPrice =
    item.discount_price === null || item.discount_price === undefined
      ? null
      : toNumber(item.discount_price)
  const unitPrice =
    item.unit_price === null || item.unit_price === undefined
      ? discountPrice ?? price
      : toNumber(item.unit_price)
  const quantity = toNumber(item.quantity)
  return {
    ...item,
    quantity,
    price,
    discount_price: discountPrice,
    stock: toNumber(item.stock),
    available_quantity: toNumber(item.available_quantity ?? item.stock),
    unit_price: unitPrice,
    total_price:
      item.total_price === null || item.total_price === undefined
        ? unitPrice * quantity
        : toNumber(item.total_price),
  }
}

function normalizeOrder(order: any): Order {
  if (!order) return order
  return {
    ...order,
    total: toNumber(order.total),
    subtotal: toNumber(order.subtotal),
    tax: toNumber(order.tax),
    shipping_cost: toNumber(order.shipping_cost),
    discount_amount: toNumber(order.discount_amount),
    loyalty_points_used: toNumber(order.loyalty_points_used),
    items: (order.items || []).map((item: any) => ({
      ...item,
      price: toNumber(item.price),
      total: toNumber(item.total),
      quantity: toNumber(item.quantity),
    })),
  }
}

function normalizeFlashSale(sale: any): FlashSale {
  return {
    ...sale,
    price: toNumber(sale.price),
    sale_price: toNumber(sale.sale_price),
    discount_percent: toNumber(sale.discount_percent),
  }
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<{ user: User; token: string }>("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>("/api/auth/login", data),
  getProfile: () => api.get<{ user: User }>("/api/auth/profile", true),
  updateProfile: (data: { name?: string; phone?: string; address?: string }) =>
    api.put<{ user: User }>("/api/auth/profile", data, true),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/api/auth/change-password", data, true),
}

export const productApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    order?: string
    featured?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.category) searchParams.set("category", params.category)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice))
    if (params?.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice))
    if (params?.sort) searchParams.set("sort", params.sort)
    if (params?.order) searchParams.set("order", params.order)
    if (params?.featured !== undefined) searchParams.set("featured", String(params.featured))
    return api
      .get<{ products: Product[]; pagination: ApiResponse["pagination"] }>(
        `/api/products?${searchParams.toString()}`
      )
      .then((res) => ({
        ...res,
        products: (res.products || []).map(normalizeProduct),
      }))
  },
  getById: (id: number | string) =>
    api
      .get<{ product: Product }>(`/api/products/${id}`)
      .then((res) => ({ ...res, product: normalizeProduct(res.product) })),
  getFeatured: () =>
    api
      .get<{ products: Product[] }>("/api/products/featured")
      .then((res) => ({ ...res, products: (res.products || []).map(normalizeProduct) })),
  create: (data: unknown) => api.post<{ product: Product }>("/api/products", data, true),
  update: (id: number | string, data: unknown) =>
    api.put<{ product: Product }>(`/api/products/${id}`, data, true),
  delete: (id: number | string) => api.delete(`/api/products/${id}`, true),
}

export const categoryApi = {
  getAll: () =>
    api.get<{ categories: Category[] }>("/api/categories").then((res) => ({
      ...res,
      categories: (res.categories || []).map((category) => ({
        ...category,
        product_count:
          category.product_count === undefined ? undefined : toNumber(category.product_count),
      })),
    })),
  create: (data: unknown) => api.post<{ category: Category }>("/api/categories", data, true),
  update: (id: number | string, data: unknown) =>
    api.put<{ category: Category }>(`/api/categories/${id}`, data, true),
  delete: (id: number | string) => api.delete(`/api/categories/${id}`, true),
}

export const cartApi = {
  get: () =>
    api
      .get<{ items: CartItem[]; total: number; item_count: number }>("/api/cart", true)
      .then((res) => ({
        ...res,
        items: (res.items || []).map(normalizeCartItem),
        total: toNumber(res.total),
      })),
  add: (data: { product_id: number; quantity?: number }) =>
    api.post<{ cart_item: CartItem }>("/api/cart", data, true),
  update: (id: number | string, data: { quantity: number }) =>
    api.put(`/api/cart/${id}`, data, true),
  remove: (id: number | string) => api.delete(`/api/cart/${id}`, true),
  clear: () => api.delete("/api/cart", true),
}

export const wishlistApi = {
  get: () =>
    api
      .get<{ items: CartItem[] }>("/api/wishlist", true)
      .then((res) => ({ ...res, items: (res.items || []).map(normalizeCartItem) })),
  add: (data: { product_id: number }) => api.post("/api/wishlist", data, true),
  remove: (id: number | string) => api.delete(`/api/wishlist/${id}`, true),
}

export const orderApi = {
  create: (data: {
    shipping_address: string
    billing_address?: string
    payment_method: string
    notes?: string
    loyalty_points_used?: number
  }) =>
    api.post<{
      order: {
        id: number
        order_number: string
        subtotal: number
        tax: number
        shipping_cost: number
        discount_amount: number
        total: number
        loyalty_points_earned: number
      }
    }>("/api/orders", data, true),
  getMyOrders: () =>
    api
      .get<{ orders: Order[] }>("/api/orders", true)
      .then((res) => ({ ...res, orders: (res.orders || []).map(normalizeOrder) })),
  getById: (id: number | string) =>
    api
      .get<{ order: Order }>(`/api/orders/${id}`, true)
      .then((res) => ({ ...res, order: normalizeOrder(res.order) })),
  getAll: (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.limit) searchParams.set("limit", String(params.limit))
    return api
      .get<{ orders: Order[] }>(`/api/orders/admin?${searchParams.toString()}`, true)
      .then((res) => ({ ...res, orders: (res.orders || []).map(normalizeOrder) }))
  },
  updateStatus: (
    id: number | string,
    data: { status?: string; payment_status?: string }
  ) => api.put<{ order: Order }>(`/api/orders/${id}/status`, data, true),
}

export const reviewApi = {
  get: (productId: number | string) =>
    api.get<{ reviews: Review[] }>(`/api/reviews/${productId}/reviews`),
  create: (productId: number | string, data: { rating: number; comment?: string }) =>
    api.post<{ review: Review }>(`/api/reviews/${productId}/reviews`, data, true),
}

export const flashSaleApi = {
  getActive: () =>
    api
      .get<{ flash_sales: FlashSale[] }>("/api/flash-sales")
      .then((res) => ({
        ...res,
        flash_sales: (res.flash_sales || []).map(normalizeFlashSale),
      })),
  create: (data: unknown) => api.post<{ flash_sale: FlashSale }>("/api/flash-sales", data, true),
}

export const loyaltyApi = {
  getProfile: () => api.get<LoyaltyProfile>("/api/loyalty/profile", true),
  getTransactions: () =>
    api.get<{ transactions: LoyaltyTransaction[] }>("/api/loyalty/transactions", true),
  getRewards: () => api.get<{ rewards: Reward[] }>("/api/loyalty/rewards", true),
  redeem: (data: { reward_id: number }) =>
    api.post<{ message: string; reward: Reward; remaining_points: number }>(
      "/api/loyalty/redeem",
      data,
      true
    ),
}

export const adminApi = {
  getDashboardStats: () =>
    api.get<{
      stats: {
        total_users: number
        total_products: number
        total_orders: number
        total_revenue: number
        low_stock_items: number
      }
      recent_orders: Order[]
    }>("/api/admin/dashboard", true),
  getAllProducts: () =>
    api
      .get<{ products: Product[] }>("/api/admin/products", true)
      .then((res) => ({ ...res, products: (res.products || []).map(normalizeProduct) })),
  getAllUsers: () => api.get<{ users: User[] }>("/api/admin/users", true),
}
