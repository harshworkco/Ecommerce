"use client"
import { productApi, categoryApi } from "@/lib/api"
import ProductCard from "@/components/ProductCard"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { formatPrice } from "@/lib/utils"
import type { Product, Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Menu, Search } from "lucide-react"
import Link from "next/link"

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")

  const page = parseInt(searchParams.get("page") || "1")
  const limit = 12
  const category = searchParams.get("category") || ""
  const search = searchParams.get("search") || ""
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const sort = searchParams.get("sort") || "created_at"
  const order = searchParams.get("order") || "DESC"
  const featured = searchParams.get("featured") === "true"

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [prodRes, catRes] = await Promise.all([
          productApi.getAll({
            page,
            limit,
            category: category || undefined,
            search: search || undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sort,
            order,
            featured,
          }),
          categoryApi.getAll(),
        ])
        if (mounted) {
          setProducts(prodRes.products || [])
          setCategories(catRes.categories || [])
          setTotal(prodRes.pagination?.total || 0)
          setPagination(prodRes.pagination || { page: 1, totalPages: 1 })
        }
      } catch (error) {
        console.error("Failed to load products", error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [page, limit, category, search, minPrice, maxPrice, sort, order, featured])

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const activeCategory = categories.find((c) => (c.slug || String(c.id)) === category)

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
      <div className="mb-8 rounded-3xl border border-border bg-secondary/50 p-6 sm:p-8">
        <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition-colors hover:text-primary">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{featured ? "Featured" : activeCategory?.name || "All products"}</span>
        </nav>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {featured ? "Featured products" : activeCategory?.name || "All products"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"} available
            </p>
          </div>
          <div className="flex items-center gap-2">
            {featured && <Badge variant="default" className="rounded-full px-3 py-1.5">Featured</Badge>}
            <select
              value={`${sort}:${order}`}
              onChange={(e) => {
                const [nextSort, nextOrder] = e.target.value.split(":")
                const params = new URLSearchParams(searchParams.toString())
                params.set("sort", nextSort)
                params.set("order", nextOrder)
                params.delete("page")
                router.push(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              className="input-field h-10 w-auto pr-8 text-sm"
            >
              <option value="created_at:DESC">Newest first</option>
              <option value="price:ASC">Price: low to high</option>
              <option value="price:DESC">Price: high to low</option>
              <option value="name:ASC">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(true)}
        className="btn-outline mb-6 w-auto px-4 lg:hidden"
      >
        <Menu size={16} /> Filters
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-8 hidden lg:block">
          <div className="sticky top-24 space-y-7 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Categories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => updateQuery("category", "")}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${!category ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateQuery("category", cat.slug || String(cat.id))}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${category === (cat.slug || String(cat.id)) ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Price range</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="input-field h-10"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="input-field h-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    updateQuery("minPrice", priceMin)
                    updateQuery("maxPrice", priceMax)
                  }}
                  className="w-full"
                >
                  Apply filters
                </Button>
                <button
                  onClick={() => {
                    router.push("/products")
                    setPriceMin("")
                    setPriceMax("")
                  }}
                  className="w-full rounded-xl py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:col-span-9">
          <p className="mb-6 text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{products.length}</span> of {total} products
          </p>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </span>
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                {category || search || minPrice || maxPrice ? (
                  <Button variant="outline" onClick={() => router.push("/products")} className="mt-5">
                    Clear filters
                  </Button>
                ) : null}
              </div>
            )}
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateQuery("page", String(pageNum))}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                      pageNum === page
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "border border-input text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Categories</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => { updateQuery("category", ""); setSidebarOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { updateQuery("category", cat.slug || String(cat.id)); setSidebarOpen(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === (cat.slug || String(cat.id)) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Price Range</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Min price</label>
                    <input type="number" value={minPrice} onChange={(e) => setPriceMin(e.target.value)} className="input-field w-full h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Max price</label>
                    <input type="number" value={maxPrice} onChange={(e) => setPriceMax(e.target.value)} className="input-field w-full h-9" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => { updateQuery("minPrice", ""); updateQuery("maxPrice", ""); setSidebarOpen(false) }} flex-1>
                Clear
              </Button>
              <Button onClick={() => { updateQuery("minPrice", priceMin); updateQuery("maxPrice", priceMax); setSidebarOpen(false) }} flex-1>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
            <div className="h-8 w-32 rounded bg-secondary"></div>
            <div className="h-4 w-64 rounded bg-secondary"></div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
