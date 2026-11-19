"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { adminApi } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/utils"
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductImage from "@/components/ProductImage"
import type { Order, Product } from "@/types"

type Stats = {
  total_users: number
  total_products: number
  total_orders: number
  total_revenue: number
  low_stock_items: number
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  processing: "bg-sky-500/10 text-sky-700",
  shipped: "bg-indigo-500/10 text-indigo-700",
  delivered: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-rose-500/10 text-rose-700",
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== "admin") {
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getAllProducts(),
        ])
        if (!active) return
        setStats(statsRes.stats || null)
        setRecentOrders(statsRes.recent_orders || [])
        setProducts(productsRes.products || [])
      } catch {
        // keep the dashboard shell visible
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard...
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <h2 className="mb-2 text-2xl font-bold">Access denied</h2>
        <p className="mb-4 text-muted-foreground">Admin access required.</p>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </div>
    )
  }

  const cards = [
    {
      title: "Total revenue",
      value: formatPrice(stats?.total_revenue || 0),
      icon: DollarSign,
      tone: "bg-emerald-500/10 text-emerald-600",
      hint: "paid orders",
    },
    {
      title: "Orders",
      value: (stats?.total_orders || 0).toLocaleString(),
      icon: ShoppingCart,
      tone: "bg-sky-500/10 text-sky-600",
      hint: "all time",
    },
    {
      title: "Customers",
      value: (stats?.total_users || 0).toLocaleString(),
      icon: Users,
      tone: "bg-violet-500/10 text-violet-600",
      hint: "registered",
    },
    {
      title: "Products",
      value: (stats?.total_products || 0).toLocaleString(),
      icon: Package,
      tone: "bg-amber-500/10 text-amber-600",
      hint: "in catalogue",
    },
  ]

  const lowStockProducts = products
    .filter((product) => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.name}. Here&apos;s what&apos;s happening in your store.
          </p>
        </div>
        <Link href="/admin/products" className="btn-primary h-10 px-5 text-sm">
          Manage products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {stats && stats.low_stock_items > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">{stats.low_stock_items} products</span> are running
            low on stock. Restock soon to avoid missed sales.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card shadow-soft xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No orders yet. Orders will appear here as customers check out.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 font-semibold">{order.order_number}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {(order as Order & { user_name?: string }).user_name || `User #${order.user_id}`}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            STATUS_STYLES[order.status] || "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">Low stock</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {lowStockProducts.length}
            </span>
          </div>
          <div className="space-y-3 p-5">
            {lowStockProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Everything is well stocked.
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                    <ProductImage src={product.image_url} alt={product.name} seed={product.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category_name || "Uncategorised"}</p>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      product.stock === 0 ? "text-rose-600" : "text-amber-600"
                    }`}
                  >
                    {product.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold">Recently added products</h2>
          <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">
            Manage all
          </Link>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                <ProductImage src={product.image_url} alt={product.name} seed={product.id} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.discount_price ?? product.price)}
                  {!product.is_active && " · inactive"}
                </p>
              </div>
              {product.is_featured && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Featured
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
