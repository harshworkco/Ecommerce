"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { orderApi } from "@/lib/api"
import { formatPrice, formatDate } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !params?.id) return
    let mounted = true
    const load = async () => {
      try {
        const res = await orderApi.getById(params.id)
        if (mounted && res.order) setOrder(res.order)
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load order")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [authLoading, isAuthenticated, params?.id])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
          <div className="h-8 w-48 rounded bg-secondary"></div>
          <div className="h-4 w-64 rounded bg-secondary"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Please sign in to view this order</h2>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusConfig[order.status]?.color}>
            {statusConfig[order.status]?.label || order.status}
          </Badge>
          <Badge variant="outline">{order.payment_status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total)}</p>
                  </div>
                ))}
                {(order.items || []).length === 0 && (
                  <p className="py-3 text-sm text-muted-foreground">No items in this order.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Address: </span>
                {order.shipping_address}
              </p>
              {order.billing_address && (
                <p>
                  <span className="text-muted-foreground">Billing: </span>
                  {order.billing_address}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Payment: </span>
                {order.payment_method}
              </p>
              {order.notes && (
                <p>
                  <span className="text-muted-foreground">Notes: </span>
                  {order.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Free"}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            {order.loyalty_points_used > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                {order.loyalty_points_used} loyalty points used
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
