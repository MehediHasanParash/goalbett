"use client"
import { JackpotDisplay } from "@/components/ui/jackpot-display"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Crown, Gem, Star, Play, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function JackpotsPage() {
  const jackpotGames = [
    {
      title: "Mega Fortune Dreams",
      jackpot: "$2,847,392",
      category: "Mega Jackpot",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      players: "3.2K",
      hot: true,
    },
    {
      title: "Divine Fortune",
      jackpot: "$184,729",
      category: "Major Jackpot",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      players: "1.8K",
      hot: false,
    },
    {
      title: "Hall of Gods",
      jackpot: "$47,293",
      category: "Minor Jackpot",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      players: "950",
      hot: true,
    },
    {
      title: "Arabian Nights",
      jackpot: "$3,847",
      category: "Mini Jackpot",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      players: "654",
      hot: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-orange-950 to-yellow-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-800 to-orange-800 border-b border-yellow-600/30 shadow-2xl backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Jackpots
              </h1>
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-yellow-200 hover:text-white">
                  All Jackpots
                </Button>
                <Button variant="ghost" size="sm" className="text-yellow-200 hover:text-white">
                  Must Hit By
                </Button>
                <Button variant="ghost" size="sm" className="text-yellow-200 hover:text-white">
                  Recent Winners
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Main Jackpot Display */}
        <div className="mb-8">
          <JackpotDisplay variant="full" />
        </div>

        {/* Jackpot Games */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Jackpot Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jackpotGames.map((game, index) => (
              <Link key={index} href={game.url}>
                <Card className="bg-gradient-to-br from-yellow-800/80 to-orange-800/80 border border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-0 relative">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {game.hot && (
                          <Badge className="bg-red-500 text-white animate-pulse">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            HOT
                          </Badge>
                        )}
                        <Badge className="bg-yellow-500 text-black font-bold">
                          <Trophy className="h-3 w-3 mr-1" />
                          JACKPOT
                        </Badge>
                      </div>

                      {/* Players */}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-blue-500/80 text-white">{game.players}</Badge>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg mb-2">{game.title}</h3>
                        <div className="text-center mb-2">
                          <div className="text-xs text-yellow-400 mb-1">{game.category}</div>
                          <div className="text-2xl font-black text-yellow-400 animate-pulse">{game.jackpot}</div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-yellow-500 text-black font-bold hover:bg-yellow-400">
                          <Play className="h-4 w-4 mr-2" />
                          Play Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* How Jackpots Work */}
        <Card className="bg-gradient-to-r from-yellow-800/50 to-orange-800/50 border border-yellow-600/30">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Gem className="h-5 w-5" />
              How Progressive Jackpots Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Play to Contribute</h4>
                <p className="text-yellow-200 text-sm">Every bet contributes to the growing jackpot pool</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Jackpot Grows</h4>
                <p className="text-yellow-200 text-sm">The jackpot increases with every spin across the network</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Hit the Jackpot</h4>
                <p className="text-yellow-200 text-sm">Land the winning combination to claim the prize</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-8 w-8 text-purple-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Instant Payout</h4>
                <p className="text-yellow-200 text-sm">Winners receive their jackpot instantly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
