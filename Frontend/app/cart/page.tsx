"use client"

import { cartApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatPrice } from "@/lib/utils"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { Trash2, ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductImage from "@/components/ProductImage"
import type { CartItem } from "@/types"

export default function CartPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<number>>(new Set())

  const computeTotal = (cartItems: CartItem[]) =>
    cartItems.reduce((sum, i) => sum + (i.total_price || i.unit_price * i.quantity), 0)

  const loadCart = async () => {
    if (!isAuthenticated) return
    try {
      const res = await cartApi.get()
      setItems(res.items || [])
      setTotal(computeTotal(res.items || []))
    } catch (error: any) {
      toast.error(error.message || "Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    loadCart()
  }, [isAuthenticated])

  const updateQuantity = async (id: number, change: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const newQty = item.quantity + change
    if (newQty < 1) return
    setUpdating((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try {
      await cartApi.update(id, { quantity: newQty })
      setItems(items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)))
      setTotal(computeTotal(items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))))
      window.dispatchEvent(new Event("cart-updated"))
    } catch (error: any) {
      toast.error(error.message || "Failed to update quantity")
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const removeItem = async (id: number) => {
    setUpdating((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try {
      await cartApi.remove(id)
      const nextItems = items.filter((i) => i.id !== id)
      setItems(nextItems)
      setTotal(computeTotal(nextItems))
      window.dispatchEvent(new Event("cart-updated"))
      toast.success("Removed from cart")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item")
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const clearCart = async () => {
    try {
      await cartApi.clear()
      setItems([])
      setTotal(0)
      window.dispatchEvent(new Event("cart-updated"))
      toast.success("Cart cleared")
    } catch (error: any) {
      toast.error(error.message || "Failed to clear cart")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Please sign in to view your cart</h2>
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
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Your cart is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add products to get started.</p>
              <Link href="/products" className="mt-6">
                <Button>
                  Start Shopping <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                    <ProductImage src={item.image_url} alt={item.name} seed={item.product_id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.product_id}`} className="hover:text-primary">
                      <h3 className="truncate font-medium">{item.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)} each</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={updating.has(item.id) || item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input transition-colors hover:bg-secondary disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={updating.has(item.id) || item.quantity >= item.available_quantity}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-input transition-colors hover:bg-secondary disabled:opacity-40"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating.has(item.id)}
                        className="ml-2 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="ml-auto text-right font-semibold">
                    {formatPrice(item.total_price)}
                  </div>
                </div>
              ))}
              {items.some((i) => i.quantity > i.available_quantity) && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  Some items exceed available stock. Please reduce quantity.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Order Summary</h2>
            {items.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{total > 100 ? "You unlocked free shipping!" : `Add ${formatPrice(100 - total)} for free shipping`}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (total / 100) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className={total > 100 ? "font-medium text-emerald-600" : ""}>
                  {total > 100 ? "FREE" : "$10.00"}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total + (total > 100 ? 0 : 10))}</span>
              </div>
            </div>
            {items.length > 0 && (
              <Link href="/checkout" className="btn-primary w-full">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
            )}
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="mt-3 w-full rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
