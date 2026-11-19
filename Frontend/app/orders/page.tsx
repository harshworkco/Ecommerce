"use client"

import { orderApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Package, Clock, DollarSign, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    if (!isAuthenticated) return
    try {
      const res = await orderApi.getMyOrders()
      setOrders(res.orders || [])
    } catch (error: any) {
      console.error("Failed to load orders", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Please sign in to view your orders</h2>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
          <div className="h-8 w-32 rounded bg-secondary"></div>
          <div className="h-4 w-64 rounded bg-secondary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Orders</span>
        </nav>
        <h1 className="text-3xl font-extrabold sm:text-4xl">My orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track and review everything you've purchased.</p>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
          <Link href="/products">
            <Button className="mt-4">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-soft">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 pb-3 pt-3 text-sm font-medium text-muted-foreground">Order #</th>
                <th className="px-3 pb-3 pt-3 text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-3 pb-3 pt-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-3 pb-3 pt-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                <th className="px-3 pb-3 pt-3 text-right text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-4 font-semibold">{order.order_number}</td>
                  <td className="px-3 py-4 text-muted-foreground">{formatDate(order.created_at)}</td>
                  <td className="px-3 py-4">
                    <Badge variant="outline" className={statusConfig[order.status]?.color}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 text-right font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-3 py-4 text-right">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3">
                        View <ChevronRight size={14} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
