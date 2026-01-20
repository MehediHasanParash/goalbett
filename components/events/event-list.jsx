"use client"

import { useEvents } from "@/hooks/useEvents"
import { useTenant } from "@/components/providers/tenant-provider"
import { useBetSlip } from "@/hooks/useBetSlip"
import { Clock, Play } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function EventList({ sportSlug = null, leagueId = null, status = null, featured = false, limit = 20 }) {
  const { events, isLoading, isError } = useEvents({ sportSlug, leagueId, status, featured, limit })
  const { primaryColor } = useTenant()
  const { addSelection, isInBetslip, getSelection } = useBetSlip()

  const handleOddsClick = (event, selectionName, odds, marketId, selectionIndex) => {
    addSelection({
      eventId: event._id,
      marketId,
      selectionIndex,
      eventName: event.name,
      marketName: "Match Result",
      selectionName,
      odds,
      startTime: event.startTime,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#1A2F45] rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-[#0A1A2F] rounded w-1/3 mb-3" />
            <div className="flex justify-between items-center">
              <div className="h-6 bg-[#0A1A2F] rounded w-1/4" />
              <div className="flex gap-2">
                <div className="h-10 w-16 bg-[#0A1A2F] rounded" />
                <div className="h-10 w-16 bg-[#0A1A2F] rounded" />
                <div className="h-10 w-16 bg-[#0A1A2F] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="text-red-400 text-sm">Failed to load events</div>
  }

  if (events.length === 0) {
    return <div className="text-center py-8 text-[#B8C5D6]">No events available</div>
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const isLive = event.status === "live"
        const selection = getSelection(event._id)
        const mockMarketId = `market_${event._id}_1x2`

        // Mock odds for display
        const odds = [
          { name: event.homeTeam.name, value: 1.85 + Math.random() * 0.5 },
          { name: "Draw", value: 3.2 + Math.random() * 0.4 },
          { name: event.awayTeam.name, value: 2.1 + Math.random() * 0.6 },
        ]

        return (
          <div
            key={event._id}
            className="bg-[#1A2F45] rounded-xl p-4 border border-[#2A3F55] hover:border-[#3A4F65] transition-colors"
          >
            {/* League and Time */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-[#B8C5D6]">
                <span>{event.league?.name || "League"}</span>
                {event.league?.country && <span className="text-xs">({event.league.country})</span>}
              </div>
              <div className="flex items-center gap-2">
                {isLive ? (
                  <span
                    className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    <Play className="w-3 h-3" />
                    LIVE {event.liveInfo?.minute}'
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-[#B8C5D6]">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(event.startTime), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Teams and Score */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#F5F5F5]">{event.homeTeam.name}</span>
                  {isLive && event.homeTeam.score !== null && (
                    <span className="font-bold text-lg" style={{ color: primaryColor }}>
                      {event.homeTeam.score}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#F5F5F5]">{event.awayTeam.name}</span>
                  {isLive && event.awayTeam.score !== null && (
                    <span className="font-bold text-lg" style={{ color: primaryColor }}>
                      {event.awayTeam.score}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Odds */}
            <div className="grid grid-cols-3 gap-2">
              {odds.map((odd, index) => {
                const isSelected = selection?.selectionIndex === index

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleOddsClick(event, odd.name, Number.parseFloat(odd.value.toFixed(2)), mockMarketId, index)
                    }
                    className={`py-3 px-4 rounded-lg text-center transition-all duration-200 ${
                      isSelected ? "ring-2 ring-offset-1 ring-offset-[#1A2F45]" : "bg-[#0A1A2F] hover:bg-[#2A3F55]"
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${primaryColor}20` : undefined,
                      borderColor: isSelected ? primaryColor : undefined,
                      ringColor: isSelected ? primaryColor : undefined,
                    }}
                  >
                    <div className="text-xs text-[#B8C5D6] mb-1">{index === 0 ? "1" : index === 1 ? "X" : "2"}</div>
                    <div className="font-bold" style={{ color: isSelected ? primaryColor : "#F5F5F5" }}>
                      {odd.value.toFixed(2)}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* More Markets Link */}
            <button
              className="w-full mt-3 py-2 text-sm text-center hover:underline transition-colors"
              style={{ color: primaryColor }}
            >
              +50 more markets
            </button>
          </div>
        )
      })}
    </div>
  )
}
