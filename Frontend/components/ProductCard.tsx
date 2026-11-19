"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { formatPrice } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { cartApi, wishlistApi } from "@/lib/api"
import type { Product } from "@/types"
import { Heart, ShoppingBag, Loader2, Star } from "lucide-react"
import ProductImage from "@/components/ProductImage"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [wishlisting, setWishlisting] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const unitPrice = product.discount_price ?? product.price
  const hasDiscount = !!product.discount_price && product.discount_price < product.price
  const discount = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0
  const outOfStock = product.stock <= 0

  const requireAuth = () => {
    if (isAuthenticated) return true
    toast.error("Please sign in to continue")
    router.push("/login")
    return false
  }

  const handleAddToCart = async () => {
    if (!requireAuth()) return
    setAdding(true)
    try {
      await cartApi.add({ product_id: product.id, quantity: 1 })
      window.dispatchEvent(new Event("cart-updated"))
      toast.success("Added to cart")
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart")
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async () => {
    if (!requireAuth()) return
    setWishlisting(true)
    try {
      const res = await wishlistApi.get()
      const existing = (res.items || []).find((item) => item.product_id === product.id)
      if (existing) {
        await wishlistApi.remove(existing.id)
        setWishlisted(false)
        toast.success("Removed from wishlist")
      } else {
        await wishlistApi.add({ product_id: product.id })
        setWishlisted(true)
        toast.success("Added to wishlist")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist")
    } finally {
      setWishlisting(false)
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Link href={`/products/${product.id}`} aria-label={product.name} className="block h-full w-full">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            seed={product.id}
            className="transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="inline-flex items-center rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              −{discount}%
            </span>
          )}
          {outOfStock && (
            <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              Sold out
            </span>
          )}
          {!outOfStock && product.stock <= 10 && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              Only {product.stock} left
            </span>
          )}
        </div>

        <button
          onClick={handleWishlist}
          disabled={wishlisting}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-all hover:scale-110 hover:bg-white disabled:opacity-60"
        >
          {wishlisting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={16} className={wishlisted ? "fill-rose-500 text-rose-500" : ""} />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {product.category_name || "Lumen"}
          </span>
          {typeof product.average_rating === "number" && product.average_rating > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(product.average_rating).toFixed(1)}
              {product.review_count ? (
                <span className="font-normal text-muted-foreground">({product.review_count})</span>
              ) : null}
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`} className="transition-colors hover:text-primary">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{product.name}</h3>
        </Link>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold">{formatPrice(unitPrice)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || outOfStock}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShoppingBag size={15} />
          )}
          {outOfStock ? "Sold out" : adding ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </article>
  )
}
