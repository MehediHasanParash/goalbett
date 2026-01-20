"use client"

import { useSports } from "@/hooks/useSports"
import { useTenant } from "@/components/providers/tenant-provider"
import Image from "next/image"
import Link from "next/link"

export function SportsList({ featured = false, category = null, onSportClick }) {
  const { sports, isLoading, isError } = useSports({ featured, category })
  const { primaryColor } = useTenant()

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-24 animate-pulse">
            <div className="w-20 h-20 bg-[#1A2F45] rounded-xl mx-auto mb-2" />
            <div className="h-4 bg-[#1A2F45] rounded mx-auto w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="text-red-400 text-sm">Failed to load sports</div>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {sports.map((sport) => (
        <Link
          key={sport._id}
          href={`/games?sport=${sport.slug}`}
          onClick={() => onSportClick?.(sport)}
          className="flex-shrink-0 group"
        >
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 border-2 border-transparent group-hover:border-current"
            style={{
              backgroundColor: primaryColor || "#FFD700",
              color: "#0A1A2F",
            }}
          >
            {sport.icon ? (
              <Image
                src={sport.icon || "/placeholder.svg"}
                alt={sport.name}
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-2xl font-bold">{sport.name.charAt(0)}</span>
            )}
          </div>
          <p className="text-center text-sm font-medium text-[#F5F5F5] group-hover:text-current transition-colors">
            {sport.name}
          </p>
        </Link>
      ))}
    </div>
  )
}
