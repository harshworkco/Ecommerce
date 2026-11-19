import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
  src: string
  alt?: string
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt = "", ...props }, ref) => (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("rounded-full", className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

export { Avatar }
