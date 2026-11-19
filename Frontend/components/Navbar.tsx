"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import {
  ShoppingBag,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  LayoutDashboard,
  Package,
  Sparkles,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cartApi } from "@/lib/api"

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/deals", label: "Deals" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/products?sort=created_at&order=DESC", label: "New in" },
]

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0)
      return
    }
    try {
      const res = await cartApi.get()
      setCartCount(res.item_count ?? (res.items || []).reduce((sum, i) => sum + i.quantity, 0))
    } catch {
      setCartCount(0)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
    window.addEventListener("cart-updated", refreshCart)
    return () => window.removeEventListener("cart-updated", refreshCart)
  }, [refreshCart])

  useEffect(() => {
    setUserMenuOpen(false)
    setMenuOpen(false)
  }, [pathname])

  if (pathname.startsWith("/admin")) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink text-white/75">
        <div className="container flex h-9 items-center justify-center gap-2 text-[11px] font-medium sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Free shipping on orders over $100</span>
          <span className="hidden text-white/25 sm:inline">/</span>
          <span className="hidden sm:inline">30-day easy returns</span>
          <span className="hidden text-white/25 md:inline">/</span>
          <span className="hidden md:inline">Secure checkout</span>
        </div>
      </div>

      <div className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-sm font-extrabold text-white shadow-glow">
              L
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">Lumen</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="h-10 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus:border-transparent focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>

          <div className="flex items-center gap-1">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
            >
              <Heart className="h-5 w-5" />
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {!isAuthenticated ? (
              <Link
                href="/login"
                className="ml-1 hidden rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 sm:inline-flex"
              >
                Sign in
              </Link>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-xs font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden max-w-[90px] truncate md:inline">{user?.name}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lift animate-scale-in">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <MenuItem icon={<User className="h-4 w-4" />} label="Profile" onClick={() => router.push("/profile")} />
                    <MenuItem icon={<Package className="h-4 w-4" />} label="My orders" onClick={() => router.push("/orders")} />
                    {user?.role === "admin" && (
                      <MenuItem
                        icon={<LayoutDashboard className="h-4 w-4" />}
                        label="Admin dashboard"
                        onClick={() => router.push("/admin")}
                      />
                    )}
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                        router.push("/")
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-lift animate-fade-in">
            <div className="flex items-center justify-between border-b border-border p-5">
              <span className="font-display text-lg font-extrabold">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <form onSubmit={handleSearch} className="relative mb-6">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="h-11 w-full rounded-full border border-input bg-secondary/60 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </form>

              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/wishlist" className="rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
                  Wishlist
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/orders" className="rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
                      Orders
                    </Link>
                    <Link href="/profile" className="rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
                      Profile
                    </Link>
                    {user?.role === "admin" && (
                      <Link href="/admin" className="rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
                        Admin
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="mt-auto border-t border-border p-5">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                    router.push("/")
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {icon} {label}
    </button>
  )
}
