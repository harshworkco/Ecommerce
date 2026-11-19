"use client"

import { wishlistApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatPrice } from "@/lib/utils"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductImage from "@/components/ProductImage"
import type { CartItem } from "@/types"

export default function WishlistPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Set<number>>(new Set())

  const loadWishlist = async () => {
    if (!isAuthenticated) return
    try {
      const res = await wishlistApi.get()
      setItems(res.items || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load wishlist")
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (id: number) => {
    setRemoving((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try {
      await wishlistApi.remove(id)
      setItems(items.filter((i) => i.id !== id))
      toast.success("Removed from wishlist")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item")
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Please sign in to view your wishlist</h2>
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
          <span className="text-foreground">Wishlist</span>
        </nav>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Your wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">Saved items you're keeping an eye on.</p>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Your wishlist is empty</p>
          <Link href="/products">
            <Button className="mt-4">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => {
            return (
              <article
                key={product.id}
                className="group card-elevated relative flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-secondary">
                  <Link href={`/products/${product.product_id}`} className="block h-full w-full">
                    <ProductImage src={product.image_url} alt={product.name} seed={product.product_id} />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    disabled={removing.has(product.id)}
                    className="absolute top-2 right-2 rounded-lg bg-destructive p-1.5 text-destructive-foreground transition-colors hover:bg-destructive/90"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link href={`/products/${product.product_id}`}>
                    <h3 className="line-clamp-2 font-semibold hover:text-primary transition-colors">{product.name}</h3>
                  </Link>
                  <div className="mt-auto flex items-baseline gap-2">
                    <span className="font-bold">{formatPrice(product.discount_price ?? product.price)}</span>
                    {product.discount_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link href={`/products/${product.product_id}`} className="btn-primary w-full">
                    View Product
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
