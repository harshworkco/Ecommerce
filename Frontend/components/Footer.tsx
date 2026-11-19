"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Instagram, Twitter, Facebook, Youtube, Send } from "lucide-react"

const SHOP_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/deals", label: "Flash deals" },
  { href: "/products?category=electronics", label: "Electronics" },
  { href: "/products?category=clothing", label: "Clothing" },
  { href: "/products?category=home-kitchen", label: "Home & kitchen" },
]

const COMPANY_LINKS = [
  { href: "/", label: "About us" },
  { href: "/", label: "Careers" },
  { href: "/", label: "Press" },
  { href: "/", label: "Sustainability" },
]

const SUPPORT_LINKS = [
  { href: "/orders", label: "Track order" },
  { href: "/", label: "Shipping & returns" },
  { href: "/", label: "Help center" },
  { href: "/", label: "Contact us" },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const pathname = usePathname()

  if (pathname.startsWith("/admin")) return null

  return (
    <footer className="mt-auto bg-ink text-white/70">
      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-sm font-extrabold text-white">
                L
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">Lumen</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Everyday essentials, elevated. Curated electronics, fashion, home and beauty —
              delivered fast, backed by easy returns.
            </p>
            <div className="mt-6 flex gap-2">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-primary hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />

          <div className="lg:col-span-3 lg:-mt-1">
            <h4 className="text-sm font-semibold text-white">Newsletter</h4>
            <p className="mt-3 text-sm text-white/60">
              Join the list for early access, new drops and 10% off your first order.
            </p>
            <form className="mt-4 flex overflow-hidden rounded-xl bg-white/10 p-1 focus-within:ring-2 focus-within:ring-primary">
              <input
                type="email"
                placeholder="you@example.com"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90" aria-label="Subscribe">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-xs text-white/40">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {year} Lumen Store. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="transition-colors hover:text-white">Privacy policy</Link>
            <Link href="/" className="transition-colors hover:text-white">Terms of service</Link>
            <Link href="/" className="transition-colors hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="lg:col-span-1">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
