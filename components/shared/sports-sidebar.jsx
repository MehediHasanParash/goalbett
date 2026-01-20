"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Loader2, Star } from "lucide-react"
import { useSports } from "@/hooks/useSports"
import { useLeagues } from "@/hooks/useSports"
import { useTenant } from "@/components/providers/tenant-provider"

export function SportsSidebar({ activeSport = null, className = "" }) {
  const { primaryColor } = useTenant()
  const { sports, isLoading } = useSports()
  const [expandedSport, setExpandedSport] = useState(activeSport)

  const accentColor = primaryColor || "#FFD700"

  if (isLoading) {
    return (
      <div className={`bg-[#0D1F35] border border-[#2A3F55] rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: accentColor }} />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[#0D1F35] border border-[#2A3F55] rounded-lg overflow-hidden ${className}`}>
      {/* Most Used Section */}
      <div className="p-4 border-b border-[#2A3F55]">
        <h3 className="text-sm font-semibold mb-3" style={{ color: accentColor }}>
          MOST USED
        </h3>
        <div className="space-y-1">
          {(sports || []).slice(0, 5).map((sport) => (
            <SportItem
              key={sport._id || sport.slug}
              sport={sport}
              isExpanded={expandedSport === sport.slug}
              onToggle={() => setExpandedSport(expandedSport === sport.slug ? null : sport.slug)}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>

      {/* A-Z Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#B8C5D6] mb-3">A-Z</h3>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {(sports || [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((sport) => (
              <SportItem
                key={sport._id || sport.slug}
                sport={sport}
                isExpanded={expandedSport === sport.slug}
                onToggle={() => setExpandedSport(expandedSport === sport.slug ? null : sport.slug)}
                accentColor={accentColor}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

function SportItem({ sport, isExpanded, onToggle, accentColor }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1A2F45] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{sport.icon || "⚽"}</span>
          <span className="text-sm text-[#F5F5F5] group-hover:text-[#FFD700]">{sport.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {sport.eventCount > 0 && <span className="text-xs text-[#B8C5D6]">{sport.eventCount}</span>}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#B8C5D6]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#B8C5D6]" />
          )}
        </div>
      </button>

      {isExpanded && <SportLeagues sportSlug={sport.slug} accentColor={accentColor} />}
    </div>
  )
}

function SportLeagues({ sportSlug, accentColor }) {
  const { leagues, isLoading } = useLeagues({ sportSlug })

  if (isLoading) {
    return (
      <div className="pl-10 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#B8C5D6]" />
      </div>
    )
  }

  if (!leagues || leagues.length === 0) {
    return <div className="pl-10 py-2 text-xs text-[#B8C5D6]">No leagues available</div>
  }

  return (
    <div className="pl-6 py-1 space-y-1">
      {leagues.slice(0, 10).map((league) => (
        <Link
          key={league._id || league.slug}
          href={`/sports/${sportSlug}/${league.slug}`}
          className="flex items-center justify-between px-3 py-1.5 text-sm text-[#B8C5D6] hover:text-[#FFD700] transition-colors"
        >
          <div className="flex items-center gap-2">
            {league.featured && <Star className="w-3 h-3" style={{ color: accentColor }} />}
            <span>{league.name}</span>
          </div>
          {league.eventCount > 0 && <span className="text-xs">{league.eventCount}</span>}
        </Link>
      ))}
    </div>
  )
}

export default SportsSidebar
