import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
  seed?: number | string
}

const GRADIENTS = [
  "from-sky-200 to-indigo-200",
  "from-rose-200 to-orange-200",
  "from-emerald-200 to-teal-200",
  "from-violet-200 to-fuchsia-200",
  "from-amber-200 to-yellow-100",
  "from-cyan-200 to-blue-200",
]

function hashSeed(seed: number | string): number {
  if (typeof seed === "number") return Math.abs(seed)
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export default function ProductImage({
  src,
  alt,
  className,
  priority,
  seed = alt,
}: ProductImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-full w-full object-cover", className)}
      />
    )
  }

  const gradient = GRADIENTS[hashSeed(seed) % GRADIENTS.length]

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        gradient,
        className
      )}
      aria-label={alt}
      role="img"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 text-slate-500 shadow-sm backdrop-blur">
        <Package className="h-7 w-7" />
      </div>
    </div>
  )
}
