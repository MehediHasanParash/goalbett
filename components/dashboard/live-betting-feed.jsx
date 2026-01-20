"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Users, DollarSign, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LiveBettingFeed() {
  const [liveBets, setLiveBets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLiveBets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/dashboard/live-feed", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success && data.liveBets) {
        setLiveBets(data.liveBets)
      }
    } catch (error) {
      console.error("Error fetching live bets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveBets()
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveBets, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FFD700] animate-pulse" />
            Live Betting Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLiveBets}
            disabled={loading}
            className="text-[#B8C5D6] hover:text-[#FFD700]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading && liveBets.length === 0 ? (
            <div className="text-center py-8 text-[#B8C5D6]">Loading live bets...</div>
          ) : liveBets.length === 0 ? (
            <div className="text-center py-8 text-[#B8C5D6]">No recent betting activity</div>
          ) : (
            liveBets.map((bet) => (
              <div
                key={bet.id}
                className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all animate-in slide-in-from-top"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
                      <p className="text-[#F5F5F5] font-semibold truncate">{bet.player}</p>
                      <Badge
                        className={
                          bet.type === "sports"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                            : "bg-purple-500/20 text-purple-400 border-purple-500/50"
                        }
                      >
                        {bet.type}
                      </Badge>
                      {bet.status && (
                        <Badge
                          className={
                            bet.status === "won"
                              ? "bg-green-500/20 text-green-400 border-green-500/50"
                              : bet.status === "lost"
                                ? "bg-red-500/20 text-red-400 border-red-500/50"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          }
                        >
                          {bet.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#B8C5D6] text-sm mb-1">{bet.game}</p>
                    <p className="text-[#FFD700] text-sm font-medium mb-2">{bet.bet}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-[#B8C5D6]">Odds:</span>
                        <span className="text-green-400 font-bold">{bet.odds}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-[#FFD700]" />
                        <span className="text-[#B8C5D6]">Stake:</span>
                        <span className="text-[#FFD700] font-bold">${bet.stake?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#B8C5D6] text-xs">{bet.time}</p>
                    <p className="text-green-400 font-bold text-sm mt-1">
                      ${(bet.stake * Number.parseFloat(bet.odds)).toFixed(0)}
                    </p>
                    <p className="text-[#B8C5D6] text-xs">Potential Win</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
