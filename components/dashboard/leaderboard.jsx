"use client"
import { Card3D } from "@/components/ui/3d-card"
import { Trophy, Medal, Award, Star } from "lucide-react"

export function Leaderboard() {
  const topPlayers = [
    { rank: 2, name: "Adam Jones", winnings: 32108.9, avatar: "👨‍💼" },
    { rank: 1, name: "Liam Carter", winnings: 34275.15, avatar: "👨‍🎓" },
    { rank: 3, name: "Sophia Reed", winnings: 30112.25, avatar: "👩‍💻" },
  ]

  const otherPlayers = [
    { rank: 4, name: "Ava Mitchell", winnings: 29650.8, avatar: "👩‍🎨" },
    { rank: 5, name: "Olivia Gray", winnings: 27994.6, avatar: "👩‍⚕️" },
    { rank: 6, name: "Logan Bennett", winnings: 26478.9, avatar: "👨‍🔬" },
    { rank: 7, name: "James Scott", winnings: 23710.55, avatar: "👨‍🎤" },
    { rank: 8, name: "Noah Brooks", winnings: 21507.45, avatar: "👨‍🚀" },
  ]

  const timeFilters = ["Today", "This Week", "This Month"]

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />
      default:
        return (
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold">
            {rank}
          </div>
        )
    }
  }

  return (
    <div className="pb-20 px-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <div className="w-6" />
      </div>

      {/* Time Filters */}
      <div className="flex gap-2 mb-8">
        {timeFilters.map((filter, index) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              index === 1
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Top 3 Players */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {topPlayers.map((player) => (
          <Card3D key={player.rank} className="group">
            <div
              className={`glass p-4 rounded-2xl text-center relative ${
                player.rank === 1 ? "bg-gradient-to-b from-yellow-400/20 to-yellow-600/20" : ""
              }`}
            >
              {player.rank === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                </div>
              )}
              <div className="text-4xl mb-3">{player.avatar}</div>
              <div className="font-bold mb-1">{player.name}</div>
              <div className="text-green-400 font-bold">${player.winnings.toLocaleString()}</div>
              <div className="mt-2">{getRankIcon(player.rank)}</div>
            </div>
          </Card3D>
        ))}
      </div>

      {/* Other Players */}
      <div className="space-y-3">
        {otherPlayers.map((player) => (
          <Card3D key={player.rank}>
            <div className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                {getRankIcon(player.rank)}
                <div className="text-2xl">{player.avatar}</div>
              </div>
              <div className="flex-1">
                <div className="font-bold">{player.name}</div>
                <div className="text-green-400 font-bold">${player.winnings.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  )
}
