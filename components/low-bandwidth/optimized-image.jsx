"use client"

import { useLowBandwidth } from "@/lib/contexts/low-bandwidth-context"
import Image from "next/image"
import { ImageOff } from "lucide-react"

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  essential = false,
  placeholder = "blur",
  blurDataURL,
  ...props
}) {
  const { isLowBandwidth, settings } = useLowBandwidth()

  // If low bandwidth and non-essential images are disabled, show placeholder
  if (isLowBandwidth && settings.disableImages && !essential) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ width, height }}
        aria-label={alt}
      >
        <ImageOff className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
    )
  }

  // Calculate reduced quality dimensions if enabled
  const qualityMultiplier = isLowBandwidth && settings.reducedQuality ? 0.5 : 1
  const optimizedWidth = Math.round(width * qualityMultiplier)
  const optimizedHeight = Math.round(height * qualityMultiplier)

  // If using placeholder images, modify the query
  const optimizedSrc =
    isLowBandwidth && settings.reducedQuality && src?.includes("/placeholder.svg")
      ? src.replace(/width=\d+/, `width=${optimizedWidth}`).replace(/height=\d+/, `height=${optimizedHeight}`)
      : src

  return (
    <Image
      src={optimizedSrc || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority && !isLowBandwidth}
      quality={isLowBandwidth && settings.reducedQuality ? 50 : 75}
      loading={isLowBandwidth ? "lazy" : priority ? "eager" : "lazy"}
      {...props}
    />
  )
}
