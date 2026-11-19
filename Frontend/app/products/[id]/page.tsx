"use client"

import { productApi, reviewApi, cartApi } from "@/lib/api"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Star, ShoppingCart, Truck, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ProductImage from "@/components/ProductImage"
import ProductCard from "@/components/ProductCard"
import type { Product } from "@/types"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [review, setReview] = useState("")
  const [rating, setRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)

  const gallery: string[] = []
  if (product?.image_url) gallery.push(product.image_url)
  if (Array.isArray(product?.images)) {
    gallery.push(...product.images)
  } else if (typeof product?.images === "string") {
    try {
      const parsed = JSON.parse(product.images)
      if (Array.isArray(parsed)) gallery.push(...parsed)
    } catch {
      // ignore malformed image list
    }
  }
  const hasGallery = gallery.length > 0

  const loadProduct = async () => {
    try {
      const res = await productApi.getById(params.id)
      setProduct(res.product)
      if (res.product?.category_slug) {
        try {
          const rel = await productApi.getAll({
            category: res.product.category_slug,
            limit: 5,
          })
          setRelated(
            (rel.products || [])
              .filter((item) => item.id !== res.product.id)
              .slice(0, 4)
          )
        } catch {
          setRelated([])
        }
      }
    } catch {
      notFound()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const addToCart = async (redirectToCheckout = false) => {
    if (!product) return
    if (product.stock <= 0) return
    if (!isAuthenticated) {
      toast.error("Please sign in to continue")
      router.push("/login")
      return
    }
    const qty = Math.min(quantity, product.stock)
    try {
      await cartApi.add({ product_id: product.id, quantity: qty })
      window.dispatchEvent(new Event("cart-updated"))
      toast.success("Added to cart")
      if (redirectToCheckout) router.push("/checkout")
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart")
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review")
      return
    }
    setSubmittingReview(true)
    try {
      await reviewApi.create(params.id, { rating, comment: review || undefined })
      toast.success("Review submitted")
      setReview("")
      setRating(0)
      await loadProduct()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-2 animate-pulse">
        <div className="h-8 w-32 rounded bg-secondary"></div>
        <div className="h-4 w-64 rounded bg-secondary"></div>
      </div>
    )
  }

  if (!product) return notFound()

  const unitPrice = product.discount_price ?? product.price
  const hasDiscount = product.discount_price && product.discount_price < product.price

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-primary">Home</Link>
        <span className="mx-1">/</span>
        <Link href="/products" className="transition-colors hover:text-primary">Products</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative h-[360px] sm:h-[480px] overflow-hidden rounded-2xl border border-border bg-secondary">
            <ProductImage
              src={hasGallery ? gallery[selectedImage] ?? gallery[0] : null}
              alt={product.name}
              seed={product.id}
              priority
            />
            {hasDiscount && (
              <span className="absolute left-4 top-4 inline-flex items-center rounded-lg bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-sm">
                -{Math.round(((product.price - unitPrice) / product.price) * 100)}%
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} ${i + 1}`} seed={product.id + i} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {product.category_slug ? (
                <Link href={`/products?category=${product.category_slug}`}>
                  <Badge variant="outline">{product.category_name}</Badge>
                </Link>
              ) : (
                product.category_name && <Badge variant="outline">{product.category_name}</Badge>
              )}
              {product.stock > 0 ? (
                <Badge variant="secondary" className="text-emerald-700">In stock</Badge>
              ) : (
                <Badge variant="destructive">Out of stock</Badge>
              )}
              {product.stock > 0 && product.stock <= 10 && (
                <Badge variant="secondary" className="text-amber-700">Only {product.stock} left</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={
                    star <= (product.average_rating ? Math.round(product.average_rating) : 0)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }
                />
              ))}
              <span className="text-muted-foreground text-sm ml-1">
                ({product.review_count ?? product.reviews?.length ?? 0} reviews)
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatPrice(unitPrice)}</span>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-input">
                <button
                  onClick={() => setQuantity((qty) => Math.max(1, qty - 1))}
                  className="flex h-10 w-10 items-center justify-center text-lg hover:bg-secondary disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((qty) => Math.min(product.stock, qty + 1))}
                  disabled={quantity >= product.stock}
                  className="flex h-10 w-10 items-center justify-center text-lg hover:bg-secondary disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => addToCart()}
                className="h-12 flex-1 text-base"
                disabled={product.stock <= 0}
              >
                <ShoppingCart size={20} /> Add to Cart
              </Button>
              <Button
                onClick={() => addToCart(true)}
                variant="outline"
                className="h-12 flex-1 text-base"
                disabled={product.stock <= 0}
              >
                Buy now <ArrowRight size={18} />
              </Button>
            </div>
            {product.stock <= 0 && (
              <p className="text-sm text-destructive">This item is currently unavailable.</p>
            )}
            <div className="grid gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck size={16} /> Free shipping on orders over $100
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} /> 30-day easy returns
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} /> Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h2 className="mb-3 text-lg font-bold">Description</h2>
        <p className="leading-relaxed text-muted-foreground">{product.description || "No description available."}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h2 className="mb-5 text-lg font-bold">Customer reviews</h2>
        {isAuthenticated ? (
          <form onSubmit={submitReview} className="mb-8 space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`rounded-lg p-1.5 text-xl transition-colors ${rating >= star ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}`}
                >
                  <Star size={24} className={rating >= star ? "fill-amber-400" : ""} />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={3}
              className="input-field min-h-[96px] resize-y py-2.5"
            />
            <Button type="submit" disabled={submittingReview || !rating}>
              {submittingReview ? "Submitting..." : "Submit review"}
            </Button>
          </form>
        ) : (
          <div className="mb-6 rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link> to leave a review.
          </div>
        )}
        <div className="space-y-5">
          {(product.reviews || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your thoughts.</p>
          )}
          {(product.reviews || []).map((rev: any) => (
            <div key={rev.id} className="flex gap-3 border-t border-border pt-5 first:border-0 first:pt-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-xs font-bold text-white">
                {rev.user_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{rev.user_name}</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={13} className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                    ))}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{rev.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="section-eyebrow">You may also like</span>
              <h2 className="mt-3 text-2xl font-bold">More from {product.category_name || "the collection"}</h2>
            </div>
            {product.category_slug && (
              <Link href={`/products?category=${product.category_slug}`} className="btn-outline hidden sm:inline-flex">
                View category <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
