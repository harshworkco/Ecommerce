"use client"

import { useAuth } from "@/context/AuthContext"
import { orderApi, cartApi, loyaltyApi } from "@/lib/api"
import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import {
  CreditCard,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Ticket,
  ArrowRight,
  Loader2,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductImage from "@/components/ProductImage"
import type { CartItem } from "@/types"

type PlacedOrder = {
  id?: number
  order_number: string
  subtotal: number
  tax: number
  shipping_cost: number
  discount_amount: number
  total: number
  loyalty_points_earned: number
}

export default function CheckoutPage() {
  const { user, isAuthenticated, updateUser } = useAuth()
  const [step, setStep] = useState<"shipping" | "payment" | "success">("shipping")
  const [form, setForm] = useState({
    shipping_address: "",
    billing_address: "",
    payment_method: "card",
    notes: "",
  })
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pointsAvailable, setPointsAvailable] = useState(0)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      try {
        const [cartRes, loyaltyRes] = await Promise.all([
          cartApi.get(),
          loyaltyApi.getProfile().catch(() => null),
        ])
        if (!active) return
        setItems(cartRes.items || [])
        if (loyaltyRes) setPointsAvailable(loyaltyRes.loyalty_points || 0)
        if (user?.address) setForm((current) => ({ ...current, shipping_address: user.address || "" }))
      } catch (error: any) {
        toast.error(error.message || "Failed to load checkout")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [isAuthenticated, user?.address])

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.total_price || item.unit_price * item.quantity),
      0
    )
    const tax = Math.round(subtotal * 0.1 * 100) / 100
    const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10
    const maxPoints = Math.min(pointsAvailable, Math.floor(subtotal * 20))
    const usablePoints = Math.min(pointsToUse, maxPoints)
    const discount = Math.round((usablePoints / 20) * 100) / 100
    const total = Math.max(0, subtotal + tax + shipping - discount)
    return { subtotal, tax, shipping, discount, total, maxPoints, usablePoints }
  }, [items, pointsAvailable, pointsToUse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shipping_address) {
      toast.error("Shipping address is required")
      setStep("shipping")
      return
    }
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }
    setSubmitting(true)
    try {
      const res = await orderApi.create({
        ...form,
        loyalty_points_used: totals.usablePoints,
      })
      const order = res.order as PlacedOrder
      setPlacedOrder(order)
      if (user) {
        updateUser({
          ...user,
          loyalty_points: Math.max(
            0,
            (user.loyalty_points || 0) + (order.loyalty_points_earned || 0) - totals.usablePoints
          ),
        })
      }
      setItems([])
      window.dispatchEvent(new Event("cart-updated"))
      setStep("success")
      toast.success("Order placed successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to place order")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="py-12 text-center">
          <h2 className="mb-2 text-2xl font-bold">Please sign in to checkout</h2>
          <p className="mb-6 text-muted-foreground">Your cart is saved to your account.</p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing checkout...
      </div>
    )
  }

  if (step === "success" && placedOrder) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={34} />
          </span>
          <h2 className="mt-5 text-2xl font-bold">Order placed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for your purchase. A confirmation is on its way.
          </p>
          <div className="mt-6 rounded-2xl bg-secondary/60 p-5 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Order number</span>
              <span className="font-semibold">{placedOrder.order_number}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-semibold">{formatPrice(placedOrder.total)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Points earned</span>
              <span className="font-semibold text-emerald-600">
                +{placedOrder.loyalty_points_earned} pts
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {placedOrder.id ? (
              <Link href={`/orders/${placedOrder.id}`} className="btn-primary flex-1">
                View order <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/orders" className="btn-primary flex-1">
                View orders <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/products" className="btn-outline flex-1">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </span>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add a few items before checking out.</p>
        <Link href="/products" className="btn-primary mt-6">
          Start shopping <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  const steps = [
    { key: "shipping", label: "Shipping", icon: MapPin },
    { key: "payment", label: "Payment", icon: CreditCard },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/cart" className="transition-colors hover:text-primary">Cart</Link>
          <span>/</span>
          <span className="text-foreground">Checkout</span>
        </nav>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Checkout</h1>
      </div>

      <div className="mb-8 flex items-center gap-2 sm:gap-3">
        {steps.map((s, i) => {
          const activeIndex = step === "shipping" ? 0 : 1
          const isDone = i < activeIndex
          const isActive = i === activeIndex
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <span className={`h-0.5 flex-1 rounded-full ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <h2 className="text-lg font-bold">
              {step === "shipping" ? "Shipping details" : "Payment"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "shipping"
                ? "Where should we deliver your order?"
                : "Choose how you'd like to pay."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {step === "shipping" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shipping address</label>
                    <Input
                      value={form.shipping_address}
                      onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                      placeholder="123 Main Street, City, State, ZIP"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Billing address</label>
                    <Input
                      value={form.billing_address}
                      onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                      placeholder="Same as shipping (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order notes (optional)</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Delivery instructions, gift note..."
                      rows={3}
                      className="input-field min-h-[92px] resize-y py-2.5"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      if (!form.shipping_address) {
                        toast.error("Please enter a shipping address")
                        return
                      }
                      setStep("payment")
                    }}
                  >
                    Continue to payment <ArrowRight size={16} />
                  </Button>
                </>
              )}

              {step === "payment" && (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Payment method</label>
                    {[
                      { value: "card", label: "Credit / debit card", detail: "Visa, Mastercard, Amex" },
                      { value: "paypal", label: "PayPal", detail: "Pay with your PayPal balance" },
                      { value: "cod", label: "Cash on delivery", detail: "Pay when your order arrives" },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                          form.payment_method === method.value
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-secondary"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          checked={form.payment_method === method.value}
                          onChange={() => setForm({ ...form, payment_method: method.value })}
                          className="accent-primary"
                        />
                        <div>
                          <p className="text-sm font-semibold">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.detail}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Use loyalty points</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pointsAvailable.toLocaleString()} points available · 20 points = $1 off
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={totals.maxPoints}
                        step={20}
                        value={totals.usablePoints}
                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                        className="flex-1 accent-primary"
                        disabled={totals.maxPoints <= 0}
                      />
                      <span className="w-24 text-right text-sm font-semibold">
                        -{formatPrice(totals.discount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Placing order...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Place order · {formatPrice(totals.total)}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("shipping")}
                      className="sm:w-auto"
                    >
                      Back
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        <div className="w-full lg:w-96">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-5 text-lg font-bold">Order summary</h2>
            <div className="mb-5 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                    <ProductImage src={item.image_url} alt={item.name} seed={item.product_id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={totals.shipping === 0 ? "font-medium text-emerald-600" : ""}>
                  {totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Loyalty discount</span>
                  <span>-{formatPrice(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure, encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
