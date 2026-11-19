"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Flame, Clock, ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import ProductImage from "@/components/ProductImage"
import type { FlashSale } from "@/types"

function useCountdown(endDate: string) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, new Date(endDate).getTime() - Date.now()))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  return remaining
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Ended"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function FlashCard({ sale }: { sale: FlashSale }) {
  const remaining = useCountdown(sale.end_date)
  const original = Number(sale.price)
  const salePrice = Number(sale.sale_price)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Link href={`/products/${sale.product_id}`} className="block h-full w-full">
          <ProductImage
            src={sale.image_url}
            alt={sale.name}
            seed={sale.product_id}
            className="transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </Link>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
          <Flame className="h-3 w-3" /> -{sale.discount_percent}%
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Clock className="h-3 w-3" /> {formatRemaining(remaining)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${sale.product_id}`} className="transition-colors hover:text-primary">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{sale.name}</h3>
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-rose-600">{formatPrice(salePrice)}</span>
          <span className="text-sm text-muted-foreground line-through">{formatPrice(original)}</span>
        </div>
        <Link
          href={`/products/${sale.product_id}`}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Shop deal <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

export default function FlashDeals({
  sales,
  showHeader = true,
}: {
  sales: FlashSale[]
  showHeader?: boolean
}) {
  if (!sales || sales.length === 0) return null

  return (
    <section className="section bg-secondary/40">
      <div className="container">
        {showHeader && (
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="section-eyebrow">
                <Flame className="h-3.5 w-3.5" /> Flash deals
              </span>
              <h2 className="mt-4 section-title">Limited-time prices</h2>
              <p className="mt-2 section-subtitle">
                Handpicked markdowns that disappear when the clock runs out.
              </p>
            </div>
            <Link href="/deals" className="btn-outline">
              All deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sales.slice(0, 4).map((sale) => (
            <FlashCard key={sale.id} sale={sale} />
          ))}
        </div>
      </div>
    </section>
  )
}
