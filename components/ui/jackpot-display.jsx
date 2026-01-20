"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Gem, Star, Zap } from "lucide-react"

export function JackpotDisplay({ variant = "full", className = "" }) {
  const [jackpots, setJackpots] = useState({
    mega: 2847392,
    major: 184729,
    minor: 47293,
    mini: 3847,
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Simulate real-time jackpot updates
    const interval = setInterval(() => {
      setJackpots((prev) => ({
        mega: prev.mega + Math.floor(Math.random() * 50) + 10,
        major: prev.major + Math.floor(Math.random() * 20) + 5,
        minor: prev.minor + Math.floor(Math.random() * 10) + 2,
        mini: prev.mini + Math.floor(Math.random() * 5) + 1,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (variant === "ticker") {
    return (
      <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 overflow-hidden ${className}`}>
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span className="font-bold">MEGA JACKPOT: {formatCurrency(jackpots.mega)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span className="font-bold">MAJOR JACKPOT: {formatCurrency(jackpots.major)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Gem className="h-4 w-4" />
            <span className="font-bold">MINOR JACKPOT: {formatCurrency(jackpots.minor)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span className="font-bold">MINI JACKPOT: {formatCurrency(jackpots.mini)}</span>
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">MEGA</span>
            </div>
            <div className="text-lg font-bold text-yellow-400 animate-pulse">{formatCurrency(jackpots.mega)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Crown className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">MAJOR</span>
            </div>
            <div className="text-lg font-bold text-purple-400 animate-pulse">{formatCurrency(jackpots.major)}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full variant
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6 flex items-center justify-center gap-2">
        <Zap className="h-6 w-6" />
        Progressive Jackpots
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mega Jackpot */}
        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 animate-pulse"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <Badge className="bg-yellow-500 text-black font-bold text-lg px-3 py-1">MEGA</Badge>
            </div>
            <div className="text-3xl font-black text-yellow-400 mb-2 animate-pulse">
              {formatCurrency(jackpots.mega)}
            </div>
            <div className="text-sm text-yellow-300">Must Hit By: {formatCurrency(3000000)}</div>
          </CardContent>
        </Card>

        {/* Major Jackpot */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-500/10 animate-pulse"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="h-8 w-8 text-purple-400" />
              <Badge className="bg-purple-500 text-white font-bold text-lg px-3 py-1">MAJOR</Badge>
            </div>
            <div className="text-3xl font-black text-purple-400 mb-2 animate-pulse">
              {formatCurrency(jackpots.major)}
            </div>
            <div className="text-sm text-purple-300">Must Hit By: {formatCurrency(250000)}</div>
          </CardContent>
        </Card>

        {/* Minor Jackpot */}
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-500/10 animate-pulse"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gem className="h-8 w-8 text-blue-400" />
              <Badge className="bg-blue-500 text-white font-bold text-lg px-3 py-1">MINOR</Badge>
            </div>
            <div className="text-3xl font-black text-blue-400 mb-2 animate-pulse">{formatCurrency(jackpots.minor)}</div>
            <div className="text-sm text-blue-300">Must Hit By: {formatCurrency(100000)}</div>
          </CardContent>
        </Card>

        {/* Mini Jackpot */}
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-500/10 animate-pulse"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="h-8 w-8 text-green-400" />
              <Badge className="bg-green-500 text-white font-bold text-lg px-3 py-1">MINI</Badge>
            </div>
            <div className="text-3xl font-black text-green-400 mb-2 animate-pulse">{formatCurrency(jackpots.mini)}</div>
            <div className="text-sm text-green-300">Must Hit By: {formatCurrency(10000)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Winners */}
      <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Recent Jackpot Winners
          </h3>
          <div className="space-y-2">
            {[
              { player: "Player***123", amount: 2456789, game: "Mega Fortune", time: "2 hours ago" },
              { player: "Lucky***456", amount: 156432, game: "Lightning Roulette", time: "5 hours ago" },
              { player: "Winner***789", amount: 89234, game: "Crazy Time", time: "1 day ago" },
            ].map((winner, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-slate-600/30 last:border-b-0"
              >
                <div>
                  <div className="text-white font-medium">{winner.player}</div>
                  <div className="text-slate-400 text-sm">
                    {winner.game} • {winner.time}
                  </div>
                </div>
                <div className="text-yellow-400 font-bold">{formatCurrency(winner.amount)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
