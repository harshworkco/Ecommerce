"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Users,
  Layers,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Store,
} from "lucide-react"

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/flash-sales", label: "Flash sales", icon: Zap },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="bg-ink text-white">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 text-sm font-extrabold text-white">
              L
            </span>
            <span className="font-display text-base font-extrabold tracking-tight">
              Lumen <span className="text-white/50">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Admin mode
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to store
            </Link>
          </div>
        </div>
      </div>

      <div className="container flex flex-col gap-6 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-soft lg:sticky lg:top-6 lg:flex-col">
            {LINKS.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
            <div className="my-1 hidden h-px bg-border lg:block" />
            <Link
              href="/products"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Store className="h-4 w-4" />
              View storefront
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
