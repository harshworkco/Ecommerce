import Link from "next/link"
import type { ComponentType } from "react"
import { categoryApi, flashSaleApi, productApi } from "@/lib/api"
import ProductCard from "@/components/ProductCard"
import FlashDeals from "@/components/FlashDeals"
import ProductImage from "@/components/ProductImage"
import type { Category, FlashSale, Product } from "@/types"
import {
  ArrowRight,
  Sparkles,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Smartphone,
  Shirt,
  Sofa,
  Dumbbell,
  Gem,
  BookOpen,
  Play,
  Quote,
  Check,
  Zap,
} from "lucide-react"

export const dynamic = "force-dynamic"

const CATEGORY_META: Record<
  string,
  { icon: ComponentType<{ className?: string }>; gradient: string }
> = {
  electronics: { icon: Smartphone, gradient: "from-violet-500 to-indigo-600" },
  clothing: { icon: Shirt, gradient: "from-rose-500 to-orange-500" },
  accessories: { icon: Gem, gradient: "from-amber-500 to-yellow-500" },
  "home-kitchen": { icon: Sofa, gradient: "from-emerald-500 to-teal-600" },
  sports: { icon: Dumbbell, gradient: "from-sky-500 to-cyan-600" },
  books: { icon: BookOpen, gradient: "from-orange-500 to-rose-500" },
  beauty: { icon: Sparkles, gradient: "from-fuchsia-500 to-pink-500" },
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics", description: null, created_at: "" },
  { id: 2, name: "Clothing", slug: "clothing", description: null, created_at: "" },
  { id: 3, name: "Accessories", slug: "accessories", description: null, created_at: "" },
  { id: 4, name: "Home & Kitchen", slug: "home-kitchen", description: null, created_at: "" },
  { id: 5, name: "Sports", slug: "sports", description: null, created_at: "" },
  { id: 6, name: "Books", slug: "books", description: null, created_at: "" },
  { id: 7, name: "Beauty", slug: "beauty", description: null, created_at: "" },
]

const FEATURES = [
  { icon: Truck, title: "Free & fast shipping", text: "Free delivery on every order over $100, shipped within 24 hours." },
  { icon: RefreshCw, title: "30-day easy returns", text: "Changed your mind? Return any item within 30 days, no questions." },
  { icon: ShieldCheck, title: "Secure checkout", text: "256-bit encrypted payments with buyer protection on every order." },
  { icon: Headphones, title: "24/7 real support", text: "Talk to a real human any time — by chat, email or phone." },
]

const TESTIMONIALS = [
  { name: "Amara Okafor", role: "Verified buyer", text: "The quality blew me away. Everything arrived beautifully packaged and ahead of schedule.", rating: 5 },
  { name: "Daniel Reyes", role: "Verified buyer", text: "Finally a store that gets the details right. Great prices, honest product pages, effortless returns.", rating: 5 },
  { name: "Mei Tanaka", role: "Verified buyer", text: "I've ordered four times this month. The curation is spot on and support is genuinely helpful.", rating: 5 },
]

export default async function Home() {
  let featured: Product[] = []
  let categories: Category[] = FALLBACK_CATEGORIES
  let flashSales: FlashSale[] = []
  let totalProducts = 0

  const [featuredRes, categoriesRes, dealsRes, catalogRes] = await Promise.allSettled([
    productApi.getFeatured(),
    categoryApi.getAll(),
    flashSaleApi.getActive(),
    productApi.getAll({ limit: 1 }),
  ])

  if (featuredRes.status === "fulfilled") {
    featured = featuredRes.value.products || []
  }
  if (categoriesRes.status === "fulfilled" && categoriesRes.value.categories?.length) {
    categories = categoriesRes.value.categories
  }
  if (dealsRes.status === "fulfilled") {
    flashSales = dealsRes.value.flash_sales || []
  }
  if (catalogRes.status === "fulfilled") {
    totalProducts = catalogRes.value.pagination?.total || 0
  }

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 surface-grid opacity-40" />
          <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -right-24 top-20 h-[380px] w-[380px] rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        </div>

        <div className="container grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="section-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> New season · 2026 collection
            </span>
            <h1 className="mt-6 max-w-xl text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Everyday essentials, <span className="gradient-text">elevated.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              A modern general store for the things you actually use — thoughtfully
              curated, fairly priced, and delivered fast to your door.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/products" className="btn-primary h-12 px-7 text-base">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/deals" className="btn-outline h-12 px-7 text-base">
                <Play className="h-4 w-4" /> Today&apos;s deals
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["A", "D", "M", "J"].map((c, i) => (
                    <span
                      key={c}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white ${
                        ["bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-sky-500"][i]
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 font-bold text-foreground">4.9</span>
                  </div>
                  <p className="text-muted-foreground">50,000+ happy customers</p>
                </div>
              </div>
              <div className="hidden h-10 w-px bg-border sm:block" />
              <div className="text-sm">
                <p className="font-bold text-foreground">{totalProducts || "40"}+ products</p>
                <p className="text-muted-foreground">across {categories.length} collections</p>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/40 via-fuchsia-400/30 to-sky-400/40 blur-3xl" />
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((category, index) => {
                const meta = CATEGORY_META[category.slug]
                return (
                  <HeroTile
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    icon={meta?.icon || Sparkles}
                    label={category.name}
                    sub={`${category.product_count ?? 0} products`}
                    gradient={meta?.gradient || "from-violet-500 to-indigo-600"}
                    image={category.image_url}
                    className={index % 2 === 0 ? "mt-8" : ""}
                  />
                )
              })}
            </div>

            <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3 shadow-lift backdrop-blur md:-left-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Truck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold">Free shipping</p>
                <p className="text-[11px] text-muted-foreground">on orders $100+</p>
              </div>
            </div>

            <div className="absolute -bottom-4 right-2 flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-3 shadow-lift backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold">Ships in 24h</p>
                <p className="text-[11px] text-muted-foreground">order before 5pm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee / trust strip */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 text-sm font-semibold text-muted-foreground">
          {["Free shipping over $100", "30-day returns", "Secure payments", "24/7 support", "5-star rated"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> {item}
            </span>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="section-eyebrow">Browse</span>
              <h2 className="mt-4 section-title">Shop by category</h2>
              <p className="mt-2 section-subtitle">Everything you need, organized into collections you&apos;ll love.</p>
            </div>
            <Link href="/products" className="btn-outline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const meta = CATEGORY_META[category.slug]
              const Icon = meta?.icon || Sparkles
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift"
                >
                  <div className="relative h-36 overflow-hidden">
                    <ProductImage
                      src={category.image_url}
                      alt={category.name}
                      seed={category.slug}
                      className="transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${meta?.gradient || "from-violet-600 to-indigo-600"} opacity-70 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                    <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                      <div>
                        <p className="text-sm font-bold leading-tight">{category.name}</p>
                        <p className="text-[11px] text-white/70">
                          {category.product_count ?? 0} products
                        </p>
                      </div>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white group-hover:text-ink">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <FlashDeals sales={flashSales} />

      {/* Featured products */}
      <section className="section">
        <div className="container">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="section-eyebrow">Handpicked</span>
              <h2 className="mt-4 section-title">Featured this week</h2>
              <p className="mt-2 section-subtitle">Our most-loved products, restocked and ready to ship.</p>
            </div>
            <Link href="/products?featured=true" className="btn-outline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {featured.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              No featured products available yet.
            </p>
          )}
        </div>
      </section>

      {/* Promo */}
      <section className="section bg-secondary/40">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:px-14 lg:py-20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                  <Sparkles className="h-3.5 w-3.5" /> Members save more
                </span>
                <h2 className="mt-5 max-w-md font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Earn points on every order. Spend them on the next.
                </h2>
                <p className="mt-4 max-w-md text-white/70">
                  Create a free account to unlock member pricing, early access to drops,
                  and loyalty points that turn into real discounts.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/register" className="btn-primary h-12 px-7 text-base">
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10">
                    Start shopping
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "1 pt", label: "per $10 spent" },
                  { value: "4", label: "tiers to unlock" },
                  { value: "24h", label: "dispatch" },
                  { value: "4.9★", label: "avg rating" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <p className="font-display text-3xl font-extrabold">{stat.value}</p>
                    <p className="mt-1 text-sm text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Lumen</span>
            <h2 className="section-title">Shopping, without the friction</h2>
            <p className="section-subtitle">Everything we build is designed to make buying the things you love effortless.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-secondary/40">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Loved by shoppers</span>
            <h2 className="section-title">Don&apos;t just take our word for it</h2>
            <p className="section-subtitle">Real reviews from real customers across thousands of orders.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
                <Quote className="h-8 w-8 text-primary/30" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-amber-500">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-indigo-600 px-6 py-14 text-center text-white sm:px-14">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
            <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">Join 50,000+ happy shoppers</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/80">
              Subscribe for new arrivals, exclusive offers and a welcome discount — straight to your inbox.
            </p>
            <form className="relative mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button type="button" className="h-12 rounded-xl bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-white/90">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroTile({
  href,
  icon: Icon,
  label,
  sub,
  gradient,
  image,
  className = "",
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  sub: string
  gradient: string
  image?: string | null
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-3xl border border-white/20 shadow-soft ${className}`}
    >
      <div className="absolute inset-0">
        <ProductImage src={image} alt={label} seed={label} className="transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 mix-blend-multiply`} />
      <div className="relative flex h-36 flex-col justify-between p-5">
        <Icon className="h-8 w-8 text-white/90 transition-transform duration-500 group-hover:scale-110" />
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="text-xs text-white/80">{sub}</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-ink">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
