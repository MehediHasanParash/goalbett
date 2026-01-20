"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, Eye, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function MatchDetailsPage() {
  const params = useParams()
  const [selectedMarkets, setSelectedMarkets] = useState([])
  const [showOddsHistory, setShowOddsHistory] = useState(false)

  const matchData = {
    id: params.id,
    homeTeam: "ARSENAL",
    awayTeam: "LIVERPOOL",
    homeImg: "/arsenal-football-team.jpg",
    awayImg: "/liverpool-football-team.jpg",
    league: "Premier League",
    status: "live",
    time: "42:15",
    homeScore: 1,
    awayScore: 1,
    kickoffTime: "2024-11-05 19:30",
    viewers: 2845,
    odds: {
      home: "2.45",
      draw: "3.20",
      away: "2.80",
    },
    markets: [
      {
        id: 1,
        name: "1X2",
        options: [
          { selection: "Home Win", odds: "2.45", backed: 12450 },
          { selection: "Draw", odds: "3.20", backed: 8930 },
          { selection: "Away Win", odds: "2.80", backed: 10220 },
        ],
      },
      {
        id: 2,
        name: "Over/Under 2.5",
        options: [
          { selection: "Over 2.5", odds: "1.95", backed: 15670 },
          { selection: "Under 2.5", odds: "1.90", backed: 12340 },
        ],
      },
      {
        id: 3,
        name: "Both Teams to Score",
        options: [
          { selection: "Yes", odds: "2.10", backed: 9840 },
          { selection: "No", odds: "1.78", backed: 6520 },
        ],
      },
      {
        id: 4,
        name: "Double Chance",
        options: [
          { selection: "1X", odds: "1.58", backed: 5420 },
          { selection: "X2", odds: "1.72", backed: 4890 },
          { selection: "12", odds: "1.38", backed: 8760 },
        ],
      },
    ],
  }

  const toggleMarketSelection = (market, option) => {
    const key = `${market.id}-${option.selection}`
    setSelectedMarkets((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] p-4 md:p-6 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#B8C5D6] hover:text-[#FFD700] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sports
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold">
              <Eye className="h-4 w-4 mr-2" />
              Watch Live
            </Button>
          </div>
        </div>

        {/* Match Header */}
        <Card className="bg-gradient-to-r from-[#0D1F35]/80 to-[#0D1F35]/60 border border-[#2A3F55] mb-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Home Team */}
              <div className="flex flex-col items-center">
                <img
                  src={matchData.homeImg || "/placeholder.svg"}
                  alt={matchData.homeTeam}
                  className="w-16 h-16 rounded-lg mb-2"
                />
                <h2 className="text-[#F5F5F5] font-bold text-lg">{matchData.homeTeam}</h2>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#FFD700]">{matchData.homeScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#FFD700] font-bold text-sm">LIVE</p>
                    <p className="text-2xl font-bold text-[#B8C5D6]">:</p>
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#FFD700]">{matchData.awayScore}</p>
                  </div>
                </div>
                <div className="text-[#B8C5D6] text-sm mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                    Live - {matchData.time}
                  </Badge>
                </div>
                <p className="text-[#B8C5D6] text-xs">{matchData.league}</p>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center">
                <img
                  src={matchData.awayImg || "/placeholder.svg"}
                  alt={matchData.awayTeam}
                  className="w-16 h-16 rounded-lg mb-2"
                />
                <h2 className="text-[#F5F5F5] font-bold text-lg">{matchData.awayTeam}</h2>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap text-sm text-[#B8C5D6]">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-[#FFD700]" />
                <span>{matchData.viewers.toLocaleString()} watching</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-[#FFD700]" />
                <span>Kickoff: {matchData.kickoffTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matchData.markets.map((market) => (
            <Card
              key={market.id}
              className="bg-[#0D1F35]/80 border border-[#2A3F55] hover:border-[#FFD700] transition-all"
            >
              <CardHeader>
                <CardTitle className="text-[#FFD700] text-lg">{market.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {market.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleMarketSelection(market, option)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedMarkets.includes(`${market.id}-${option.selection}`)
                        ? "bg-[#FFD700]/20 border-[#FFD700]"
                        : "bg-[#1A2F45]/50 border-[#2A3F55] hover:border-[#FFD700]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#F5F5F5] font-bold">{option.selection}</span>
                      <div className="text-right">
                        <p className="text-[#FFD700] text-2xl font-bold">{option.odds}</p>
                        <p className="text-xs text-[#B8C5D6]">{option.backed.toLocaleString()} backed</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Odds Warning */}
        <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-bold text-sm mb-1">Live Odds Update</p>
            <p className="text-yellow-200 text-xs">
              Odds update in real-time. Your betslip price is locked when you add selections.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
