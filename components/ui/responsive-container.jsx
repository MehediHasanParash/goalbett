"use client"

import { cn } from "@/lib/utils"

export function ResponsiveContainer({ children, className, maxWidth = "2xl" }) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  }

  return (
    <div className={cn("w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}
