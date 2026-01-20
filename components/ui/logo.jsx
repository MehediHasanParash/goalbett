"use client"
import Image from "next/image"
import Link from "next/link"
import { useTenant } from "@/components/providers/tenant-provider"
import { useState, useEffect } from "react"

export function Logo({ className = "", size = "default" }) {
  const { tenant, isLoading, logoUrl, brandName } = useTenant()
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    small: "h-8 w-auto",
    default: "h-12 w-auto",
    large: "h-20 w-auto",
  }

  const defaultLogo = "/images/goal-betting-logo.png"
  const hasValidLogoUrl = logoUrl && typeof logoUrl === "string" && logoUrl.trim() !== "" && logoUrl !== defaultLogo
  const finalLogoUrl = hasValidLogoUrl ? logoUrl : defaultLogo
  const finalBrandName = brandName && brandName.trim() !== "" ? brandName : "GoalBet"

  useEffect(() => {
    console.log("[v0] Logo - tenant:", tenant?.name)
    console.log("[v0] Logo - logoUrl from context:", logoUrl)
    console.log("[v0] Logo - hasValidLogoUrl:", hasValidLogoUrl)
    console.log("[v0] Logo - finalLogoUrl:", finalLogoUrl)
    console.log("[v0] Logo - brandName:", brandName)
  }, [tenant, logoUrl, brandName, hasValidLogoUrl, finalLogoUrl])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-12 w-12 bg-muted animate-pulse rounded" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const displayUrl = imgError ? defaultLogo : finalLogoUrl

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <Image
        src={displayUrl || "/placeholder.svg"}
        alt={finalBrandName}
        width={size === "large" ? 80 : size === "small" ? 32 : 48}
        height={size === "large" ? 80 : size === "small" ? 32 : 48}
        className={sizeClasses[size]}
        onError={(e) => {
          console.log("[v0] Logo image failed to load:", displayUrl)
          setImgError(true)
        }}
      />
      <span
        className={`font-bold ${size === "large" ? "text-2xl" : "text-xl"}`}
        style={{ color: "var(--secondary, #FFD700)" }}
      >
        {/* {finalBrandName} */}
      </span>
    </Link>
  )
}
