"use client"
import { JackpotDisplay } from "@/components/ui/jackpot-display"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Crown, Gem, Star, Play, TrendingUp, ArrowLeft } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A1A2F]/95 backdrop-blur-sm border-b border-[#FFD700]/30 shadow-2xl">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link href="/casino">
                <Button variant="ghost" size="sm" className="hover:bg-[#FFD700]/20 text-[#F5F5F5]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Casino</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-[#FFD700] flex items-center gap-2">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                Jackpots
              </h1>
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-[#F5F5F5]/80 hover:text-[#FFD700]">
                  All Jackpots
                </Button>
                <Button variant="ghost" size="sm" className="text-[#F5F5F5]/80 hover:text-[#FFD700]">
                  Must Hit By
                </Button>
                <Button variant="ghost" size="sm" className="text-[#F5F5F5]/80 hover:text-[#FFD700]">
                  Recent Winners
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Main Jackpot Display */}
        <div className="mb-6 sm:mb-8">
          <JackpotDisplay variant="full" />
        </div>

        {/* Jackpot Games */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#FFD700] flex items-center gap-2">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
            Jackpot Games
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {jackpotGames.map((game, index) => (
              <Link key={index} href={game.url}>
                <Card className="bg-[#0D1F35]/80 border border-[#FFD700]/30 hover:border-[#FFD700]/60 transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-0 relative">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F]/90 via-[#0A1A2F]/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1">
                        {game.hot && (
                          <Badge className="bg-red-500 text-white animate-pulse text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            HOT
                          </Badge>
                        )}
                        <Badge className="bg-[#FFD700] text-[#0A1A2F] font-bold text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          JACKPOT
                        </Badge>
                      </div>

                      {/* Players */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <Badge className="bg-blue-500/80 text-white text-xs">{game.players}</Badge>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="text-white font-bold text-base sm:text-lg mb-2">{game.title}</h3>
                        <div className="text-center mb-2">
                          <div className="text-xs text-[#FFD700] mb-1">{game.category}</div>
                          <div className="text-xl sm:text-2xl font-black text-[#FFD700] animate-pulse">
                            {game.jackpot}
                          </div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#FFD700]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-[#FFD700] text-[#0A1A2F] font-bold hover:bg-[#FFD700]/90">
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
        <Card className="bg-[#0D1F35]/50 border border-[#FFD700]/30">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
              <Gem className="h-4 w-4 sm:h-5 sm:w-5" />
              How Progressive Jackpots Work
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700]" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm sm:text-base">Play to Contribute</h4>
                <p className="text-[#B8C5D6] text-xs sm:text-sm">Every bet contributes to the growing jackpot pool</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700]" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm sm:text-base">Jackpot Grows</h4>
                <p className="text-[#B8C5D6] text-xs sm:text-sm">
                  The jackpot increases with every spin across the network
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700]" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm sm:text-base">Hit the Jackpot</h4>
                <p className="text-[#B8C5D6] text-xs sm:text-sm">Land the winning combination to claim the prize</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700]" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm sm:text-base">Instant Payout</h4>
                <p className="text-[#B8C5D6] text-xs sm:text-sm">Winners receive their jackpot instantly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
