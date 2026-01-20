"use client"
import { useState } from "react"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { Card } from "@/components/ui/card"
import useSWR from "swr"
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, ChevronLeft, Flame, Target } from "lucide-react"
import Link from "next/link"
import { getAuthToken } from "@/lib/auth-service"

const fetcher = async (url) => {
  const token = getAuthToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

const AVATARS = {
  1: "/avatars/avatar-1.png",
  2: "/avatars/avatar-2.png",
  3: "/avatars/avatar-3.png",
  4: "/avatars/avatar-4.png",
  5: "/avatars/avatar-5.png",
  6: "/avatars/avatar-6.png",
  7: "/avatars/avatar-7.png",
  8: "/avatars/avatar-8.png",
  9: "/avatars/avatar-9.png",
  10: "/avatars/avatar-10.png",
}

export default function LeaderboardPage() {
  const { isAuthenticated, loading } = useAuth()
  const { primaryColor } = useTenant()
  const [period, setPeriod] = useState("weekly")

  const accentColor = primaryColor || "#FFD700"

  const { data, error, isLoading } = useSWR(`/api/leaderboard?period=${period}`, fetcher)

  const leaderboard = data?.leaderboard || []
  const currentUserRank = data?.currentUserRank
  const totalParticipants = data?.totalParticipants || 0

  const periods = [
    { id: "daily", label: "Today" },
    { id: "weekly", label: "This Week" },
    { id: "monthly", label: "This Month" },
  ]

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />
      default:
        return (
          <div className="w-8 h-8 bg-[#2A3F55] rounded-full flex items-center justify-center text-sm font-bold">
            {rank}
          </div>
        )
    }
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getRankBgColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30"
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30"
      case 3:
        return "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/30"
      default:
        return "bg-[#1A2F45]/50 border-[#2A3F55]"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: accentColor }}
        />
      </div>
    )
  }

  // Get top 3 for podium display
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      <BettingHeader />

      <main className="container mx-auto px-4 py-36">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/menu" className="p-2 hover:bg-[#1A2F45] rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-[#B8C5D6] text-sm">{totalParticipants.toLocaleString()} players competing</p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                period === p.id ? "text-[#0A1A2F]" : "bg-[#1A2F45]/50 text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
              style={period === p.id ? { backgroundColor: accentColor } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 animate-pulse">
                <div className="h-16 bg-[#2A3F55] rounded" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/30 p-6 text-center">
            <p className="text-red-400">Failed to load leaderboard</p>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-3 mb-8">
              {podiumOrder.map((player, index) => {
                const isFirst = player.rank === 1
                const height = isFirst ? "h-32" : player.rank === 2 ? "h-24" : "h-20"

                return (
                  <div key={player.rank} className="flex flex-col items-center">
                    {/* Avatar & Info */}
                    <div className="relative mb-2">
                      {isFirst && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Trophy className="w-6 h-6 text-yellow-400" />
                        </div>
                      )}
                      <div
                        className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                          isFirst ? "border-yellow-400" : player.rank === 2 ? "border-gray-300" : "border-orange-400"
                        }`}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-[#1A2F45] to-[#2A3F55] flex items-center justify-center text-2xl">
                          {player.username.charAt(0)}
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-center truncate max-w-[80px]">{player.username}</p>
                    <p className="text-green-400 font-bold text-sm">${player.winnings.toLocaleString()}</p>

                    {/* Podium Stand */}
                    <div
                      className={`${height} w-20 mt-2 rounded-t-lg flex items-center justify-center ${
                        isFirst
                          ? "bg-gradient-to-b from-yellow-500 to-yellow-600"
                          : player.rank === 2
                            ? "bg-gradient-to-b from-gray-400 to-gray-500"
                            : "bg-gradient-to-b from-orange-500 to-orange-600"
                      }`}
                    >
                      <span className="text-2xl font-bold text-white">{player.rank}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current User Rank (if not in top 10) */}
            {currentUserRank && currentUserRank.rank > 10 && (
              <Card
                className="bg-gradient-to-r from-[#1A2F45] to-[#2A3F55] border-2 p-4 mb-4"
                style={{ borderColor: accentColor }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                  >
                    {currentUserRank.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A2F45] to-[#2A3F55] flex items-center justify-center text-lg">
                    {currentUserRank.username.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">You</p>
                    <div className="flex items-center gap-3 text-xs text-[#B8C5D6]">
                      <span>{currentUserRank.bets} bets</span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {currentUserRank.winRate}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> {currentUserRank.streak}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">${currentUserRank.winnings.toLocaleString()}</p>
                    <div className="flex items-center gap-1 justify-end text-xs">
                      {getChangeIcon(currentUserRank.change)}
                      <span
                        className={
                          currentUserRank.change > 0
                            ? "text-green-400"
                            : currentUserRank.change < 0
                              ? "text-red-400"
                              : "text-gray-400"
                        }
                      >
                        {Math.abs(currentUserRank.change)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Rest of Leaderboard */}
            <div className="space-y-3">
              {rest.map((player) => (
                <Card key={player.rank} className={`${getRankBgColor(player.rank)} border p-4`}>
                  <div className="flex items-center gap-4">
                    {getRankIcon(player.rank)}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A2F45] to-[#2A3F55] flex items-center justify-center text-lg">
                      {player.username.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{player.username}</p>
                      <div className="flex items-center gap-3 text-xs text-[#B8C5D6]">
                        <span>{player.bets} bets</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" /> {player.winRate}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" /> {player.streak}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">${player.winnings.toLocaleString()}</p>
                      <div className="flex items-center gap-1 justify-end text-xs">
                        {getChangeIcon(player.change)}
                        <span
                          className={
                            player.change > 0 ? "text-green-400" : player.change < 0 ? "text-red-400" : "text-gray-400"
                          }
                        >
                          {Math.abs(player.change)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {isAuthenticated && <BottomNavigation activeTab="menu" />}
    </div>
  )
}
