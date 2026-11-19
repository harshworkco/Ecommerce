"use client"

import { cn } from "@/lib/utils"

export function Button({
  className,
  variant = "default",
  size = "md",
  disabled,
  ...props
}: {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  [key: string]: unknown
}) {
  const variants = {
    default:
      "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-lift",
    destructive:
      "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
    outline:
      "border border-input bg-background shadow-sm hover:bg-secondary hover:border-foreground/25",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
    ghost: "hover:bg-secondary hover:text-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  const sizes = {
    sm: "h-9 px-3.5 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-7 text-base",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
}
