"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { adminApi, flashSaleApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatDate, formatPrice } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductImage from "@/components/ProductImage"
import { Loader2, Plus, Zap } from "lucide-react"
import type { FlashSale, Product } from "@/types"

const toLocalInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

const blankForm = () => {
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    product_id: "",
    discount_percent: "20",
    start: toLocalInput(now),
    end: toLocalInput(end),
    max: "5",
  }
}

export default function AdminFlashSalesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [sales, setSales] = useState<FlashSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blankForm)

  const load = async () => {
    setLoading(true)
    try {
      const [salesRes, productsRes] = await Promise.all([
        flashSaleApi.getActive(),
        adminApi.getAllProducts(),
      ])
      setSales(salesRes.flash_sales || [])
      setProducts(productsRes.products || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load flash sales")
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
    load()
  }, [authLoading, user])

  const options = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const productId = Number(form.product_id)
    const percent = Number(form.discount_percent)
    const start = new Date(form.start)
    const end = new Date(form.end)

    if (!productId) {
      toast.error("Choose a product")
      return
    }
    if (!percent || percent < 1 || percent > 90) {
      toast.error("Discount must be between 1 and 90%")
      return
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error("End time must be after start time")
      return
    }

    setSaving(true)
    try {
      await flashSaleApi.create({
        product_id: productId,
        discount_percent: percent,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        max_quantity_per_user: Number(form.max) || 5,
      })
      toast.success("Flash sale created")
      setForm(blankForm())
      await load()
    } catch (error: any) {
      toast.error(error.message || "Failed to create flash sale")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading flash sales...
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
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Flash sales</h1>
        <p className="text-sm text-muted-foreground">
          {sales.length} live right now. Deals appear on the storefront automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a flash sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select product *</option>
              {options.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {formatPrice(product.price)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={90}
              placeholder="Discount %"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            />
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Starts
              <Input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Ends
              <Input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Max per customer"
              value={form.max}
              onChange={(e) => setForm({ ...form, max: e.target.value })}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                Launch sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No live flash sales</p>
          <p className="text-sm text-muted-foreground">Launch one above to drive urgency.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="relative h-32 bg-secondary">
                <ProductImage src={sale.image_url} alt={sale.name} seed={sale.product_id} />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                  <Zap className="h-3 w-3" /> -{sale.discount_percent}%
                </span>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{sale.name}</h3>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">
                    Live
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">{formatPrice(Number(sale.sale_price))}</span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(Number(sale.price))}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ends {formatDate(sale.end_date)} · max {sale.max_quantity_per_user} per customer
                </p>
                <Link
                  href={`/products/${sale.product_id}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
