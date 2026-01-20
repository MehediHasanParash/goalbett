"use client"

import { useFeaturedEvents } from "@/hooks/useEvents"
import { useTenant } from "@/components/providers/tenant-provider"
import { useBetState } from "@/lib/bet-state"
import { Badge } from "@/components/ui/badge"
import { Loader2, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export function FeaturedEvents({ limit = 6 }) {
  const { primaryColor } = useTenant()
  const { featuredEvents, isLoading } = useFeaturedEvents(limit)
  const { addBet } = useBetState()

  const accentColor = primaryColor || "#FFD700"

  const handleAddBet = (event, selection, odds) => {
    addBet({
      eventId: event._id || event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selection,
      odds: Number.parseFloat(odds),
      league: event.league?.name || "Featured",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
      </div>
    )
  }

  if (!featuredEvents || featuredEvents.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5" style={{ color: accentColor }} />
        <h2 className="text-xl font-bold text-white">Featured Matches</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredEvents.map((event) => (
          <div
            key={event._id || event.id}
            className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                FEATURED
              </Badge>
              <span className="text-xs text-[#B8C5D6]">{event.league?.name || event.competition}</span>
            </div>

            {/* Teams */}
            <Link href={`/match/${event._id || event.id}`}>
              <div className="mb-4">
                <p className="font-semibold text-white mb-1">{event.homeTeam}</p>
                <p className="text-[#B8C5D6] text-sm">vs</p>
                <p className="font-semibold text-white mt-1">{event.awayTeam}</p>
              </div>
              <p className="text-xs text-[#B8C5D6] mb-3">
                {new Date(event.startTime || event.scheduledTime).toLocaleString()}
              </p>
            </Link>

            {/* Odds */}
            <div className="flex gap-2">
              {event.odds?.["1X2"] ? (
                <>
                  <button
                    onClick={() => handleAddBet(event, "Home", event.odds["1X2"].home)}
                    className="flex-1 py-2 bg-[#0D1F35] border border-[#2A3F55] rounded text-sm font-medium text-white hover:border-[#FFD700] hover:text-[#FFD700] transition-all"
                  >
                    <span className="text-xs text-[#B8C5D6] block">1</span>
                    {event.odds["1X2"].home?.toFixed(2)}
                  </button>
                  <button
                    onClick={() => handleAddBet(event, "Draw", event.odds["1X2"].draw)}
                    className="flex-1 py-2 bg-[#0D1F35] border border-[#2A3F55] rounded text-sm font-medium text-white hover:border-[#FFD700] hover:text-[#FFD700] transition-all"
                  >
                    <span className="text-xs text-[#B8C5D6] block">X</span>
                    {event.odds["1X2"].draw?.toFixed(2)}
                  </button>
                  <button
                    onClick={() => handleAddBet(event, "Away", event.odds["1X2"].away)}
                    className="flex-1 py-2 bg-[#0D1F35] border border-[#2A3F55] rounded text-sm font-medium text-white hover:border-[#FFD700] hover:text-[#FFD700] transition-all"
                  >
                    <span className="text-xs text-[#B8C5D6] block">2</span>
                    {event.odds["1X2"].away?.toFixed(2)}
                  </button>
                </>
              ) : (
                <p className="text-xs text-[#B8C5D6] text-center w-full">Odds coming soon</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturedEvents
