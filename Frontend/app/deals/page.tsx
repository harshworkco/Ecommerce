"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Flame, Loader2, Tag, ArrowRight } from "lucide-react"
import { flashSaleApi } from "@/lib/api"
import type { FlashSale } from "@/types"
import FlashDeals from "@/components/FlashDeals"

export default function DealsPage() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    flashSaleApi
      .getActive()
      .then((res) => {
        if (active) setSales(res.flash_sales || [])
      })
      .catch(() => {
        if (active) setSales([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 surface-grid opacity-40" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-rose-400/25 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        </div>
        <div className="container py-14 sm:py-20">
          <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-foreground">Deals</span>
          </nav>
          <span className="section-eyebrow">
            <Flame className="h-3.5 w-3.5" /> Limited time
          </span>
          <h1 className="mt-5 max-w-2xl text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Flash deals, <span className="gradient-text">before they&apos;re gone.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Live markdowns across the store. Each deal is tied to a countdown — when the
            timer ends, the price goes back up.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/products" className="btn-primary h-11 px-6">
              Browse everything <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                <Tag className="h-4 w-4" />
              </span>
              {loading ? "Loading deals..." : `${sales.length} live ${sales.length === 1 ? "deal" : "deals"} right now`}
            </span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading live deals...
        </div>
      ) : sales.length > 0 ? (
        <FlashDeals sales={sales} showHeader={false} />
      ) : (
        <div className="container py-24 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Flame className="h-8 w-8 text-muted-foreground" />
          </span>
          <h2 className="text-xl font-bold">No live deals right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon — new markdowns drop regularly.
          </p>
          <Link href="/products" className="btn-primary mt-6">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
