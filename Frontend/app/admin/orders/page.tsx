"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { orderApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatDate, formatPrice } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ReceiptText, Truck } from "lucide-react"
import type { Order } from "@/types"

type AdminOrder = Order & { user_name?: string; user_email?: string }

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"]
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"]

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  processing: "bg-sky-500/10 text-sky-700",
  shipped: "bg-indigo-500/10 text-indigo-700",
  delivered: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-rose-500/10 text-rose-700",
}

const paymentStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  paid: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-rose-500/10 text-rose-700",
  refunded: "bg-slate-500/10 text-slate-700",
}

export default function AdminOrdersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async (status: string) => {
    setLoading(true)
    try {
      const res = await orderApi.getAll({
        status: status || undefined,
        limit: 100,
      })
      setOrders((res.orders || []) as AdminOrder[])
    } catch (error: any) {
      toast.error(error.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (user?.role !== "admin") {
      setLoading(false)
      return
    }
    load(filter)
  }, [authLoading, user, filter])

  const summary = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid")
    return {
      revenue: paid.reduce((sum, o) => sum + Number(o.total || 0), 0),
      paid: paid.length,
      open: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
    }
  }, [orders])

  const update = async (order: AdminOrder, data: { status?: string; payment_status?: string }) => {
    setBusyId(order.id)
    try {
      const res = await orderApi.updateStatus(order.id, data)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: res.order?.status ?? o.status,
                payment_status: res.order?.payment_status ?? o.payment_status,
              }
            : o
        )
      )
      toast.success("Order updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update order")
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Update fulfilment and payment status for every order.
          </p>
        </div>
        <Button variant="outline" onClick={() => load(filter)}>
          <Truck className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Paid revenue", value: formatPrice(summary.revenue) },
          { label: "Paid orders", value: String(summary.paid) },
          { label: "Open orders", value: String(summary.open) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === ""
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <ReceiptText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No orders found</p>
          <p className="text-sm text-muted-foreground">
            Orders will appear here as customers check out.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fulfilment
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold">{order.order_number}</p>
                    <Badge variant="outline" className={statusStyles[order.status]}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{order.user_name || `User #${order.user_id}`}</p>
                    <p className="text-xs text-muted-foreground">{order.user_email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(e) => update(order, { status: e.target.value })}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm capitalize"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status} className="capitalize">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.payment_status}
                      disabled={busyId === order.id}
                      onChange={(e) => update(order, { payment_status: e.target.value })}
                      className={`h-9 rounded-lg border border-input bg-background px-2 text-sm capitalize ${paymentStyles[order.payment_status] || ""}`}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status} className="capitalize">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {order.payment_status !== "paid" ? (
                      <Button
                        size="sm"
                        disabled={busyId === order.id}
                        onClick={() => update(order, { payment_status: "paid" })}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">Paid</span>
                    )}
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
