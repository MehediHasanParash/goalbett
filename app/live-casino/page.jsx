"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Users, Play, Volume2, VolumeX } from "lucide-react"

export default function LiveCasinoPage() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isMuted, setIsMuted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const categories = [
    { id: "All", name: "All Games" },
    { id: "Roulette", name: "Roulette" },
    { id: "Blackjack", name: "Blackjack" },
    { id: "Baccarat", name: "Baccarat" },
    { id: "Game Shows", name: "Game Shows" },
    { id: "Poker", name: "Poker" },
  ]

  const liveGames = [
    {
      id: 1,
      title: "Lightning Roulette",
      dealer: "Emma",
      category: "Roulette",
      players: 1247,
      minBet: "$1",
      maxBet: "$5000",
      image: "/casino-roulette-table.jpg",
      status: "live",
      featured: true,
      language: "EN",
    },
    {
      id: 2,
      title: "Blackjack VIP",
      dealer: "Michael",
      category: "Blackjack",
      players: 892,
      minBet: "$25",
      maxBet: "$10000",
      image: "/sports-betting-interface.jpg",
      status: "live",
      featured: false,
      language: "EN",
    },
    {
      id: 3,
      title: "Speed Baccarat",
      dealer: "Sofia",
      category: "Baccarat",
      players: 654,
      minBet: "$5",
      maxBet: "$2500",
      image: "/casino-roulette-table.jpg",
      status: "live",
      featured: true,
      language: "EN",
    },
    {
      id: 4,
      title: "Crazy Time",
      dealer: "James",
      category: "Game Shows",
      players: 2341,
      minBet: "$0.10",
      maxBet: "$1000",
      image: "/casino-spin-wheel.jpg",
      status: "live",
      featured: true,
      language: "EN",
    },
    {
      id: 5,
      title: "Dream Catcher",
      dealer: "Anna",
      category: "Game Shows",
      players: 1876,
      minBet: "$1",
      maxBet: "$2500",
      image: "/casino-spin-wheel.jpg",
      status: "live",
      featured: false,
      language: "EN",
    },
    {
      id: 6,
      title: "Auto Roulette",
      dealer: "Auto",
      category: "Roulette",
      players: 543,
      minBet: "$0.50",
      maxBet: "$1000",
      image: "/casino-roulette-table.jpg",
      status: "live",
      featured: false,
      language: "EN",
    },
  ]

  const filteredGames = liveGames.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All" || game.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0A1A2F]/95 to-[#0A1A2F]/90 text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A1A2F]/95 backdrop-blur-md border-b border-[#FFD700]/20 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-[#FFD700] flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                Live Casino
              </h1>
              <div className="hidden md:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F5F5F5]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  All Tables
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F5F5F5]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  VIP Tables
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F5F5F5]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  Game Shows
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#F5F5F5]/50" />
                <input
                  type="text"
                  placeholder="Search live games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[#0A1A2F]/50 border border-[#FFD700]/20 rounded-lg text-white placeholder-[#F5F5F5]/50 focus:outline-none focus:border-[#FFD700] text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#FFD700]/30 text-[#FFD700] bg-transparent hover:bg-[#FFD700]/10"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? "bg-[#FFD700] text-[#0A1A2F] shadow-lg shadow-[#FFD700]/20"
                  : "bg-[#0A1A2F]/50 border border-[#FFD700]/20 text-[#F5F5F5] hover:bg-[#FFD700]/10"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Featured Games */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#FFD700] flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Featured Live Games
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredGames
              .filter((game) => game.featured)
              .map((game) => (
                <Card
                  key={game.id}
                  className="bg-[#0A1A2F]/60 border border-[#FFD700]/30 hover:border-[#FFD700]/60 transition-all duration-300 overflow-hidden group cursor-pointer shadow-xl"
                  onClick={() => setSelectedGame(game)}
                >
                  <CardContent className="p-0 relative">
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-[#0A1A2F]/20 to-transparent" />

                      {/* Live indicator */}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                        <Badge className="bg-red-500 text-white animate-pulse text-xs">
                          <div className="w-2 h-2 bg-white rounded-full mr-1" />
                          LIVE
                        </Badge>
                      </div>

                      {/* Language */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <Badge className="bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-xs">
                          {game.language}
                        </Badge>
                      </div>

                      {/* Players count */}
                      <div className="absolute top-10 sm:top-12 right-2 sm:right-3">
                        <div className="flex items-center gap-1 bg-[#0A1A2F]/80 rounded-full px-2 py-1">
                          <Users className="h-3 w-3 text-[#FFD700]" />
                          <span className="text-white text-xs">{game.players}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                        <h3 className="text-base sm:text-xl font-bold text-white mb-1">{game.title}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#F5F5F5]/70 text-xs sm:text-sm">Dealer: {game.dealer}</span>
                          <span className="text-[#F5F5F5]/70 text-xs sm:text-sm">{game.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#F5F5F5]/60">
                          <span>Min: {game.minBet}</span>
                          <span>Max: {game.maxBet}</span>
                        </div>
                      </div>

                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-[#FFD700]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-[#FFD700] text-[#0A1A2F] font-bold hover:bg-[#FFD700]/90">
                          <Play className="h-4 w-4 mr-2" />
                          Join Table
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* All Live Games */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#FFD700] flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            All Live Tables
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredGames.map((game) => (
              <Card
                key={game.id}
                className="bg-[#0A1A2F]/60 border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all duration-300 overflow-hidden group cursor-pointer shadow-lg"
                onClick={() => setSelectedGame(game)}
              >
                <CardContent className="p-0 relative">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={game.image || "/placeholder.svg"}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-transparent to-transparent" />

                    {/* Live indicator */}
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                      <Badge className="bg-red-500 text-white text-xs animate-pulse">LIVE</Badge>
                    </div>

                    {/* Players */}
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                      <div className="flex items-center gap-1 bg-[#0A1A2F]/80 rounded px-1 py-0.5">
                        <Users className="h-3 w-3 text-[#FFD700]" />
                        <span className="text-white text-xs">{game.players}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                      <h3 className="text-white font-bold text-xs sm:text-sm mb-1 truncate">{game.title}</h3>
                      <div className="flex items-center justify-between text-xs text-[#F5F5F5]/70 mb-1">
                        <span className="truncate">{game.dealer}</span>
                        <span>{game.language}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#FFD700]">
                        <span className="truncate">
                          {game.minBet} - {game.maxBet}
                        </span>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-[#FFD700]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button size="sm" className="bg-[#FFD700] text-[#0A1A2F] font-bold hover:bg-[#FFD700]/90 text-xs">
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Game Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-br from-[#0A1A2F] to-[#0A1A2F]/95 border border-[#FFD700]/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#FFD700]/20">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <Badge className="bg-red-500 text-white animate-pulse text-xs">
                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                  LIVE
                </Badge>
                <h3 className="text-base sm:text-xl font-bold text-white truncate">{selectedGame.title}</h3>
                <span className="hidden sm:inline text-[#F5F5F5]/70 text-sm truncate">
                  Dealer: {selectedGame.dealer}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[#F5F5F5]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGame(null)}
                  className="text-[#F5F5F5]/80 hover:text-[#FFD700] hover:bg-[#FFD700]/10"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Game Area */}
            <div className="aspect-video bg-black relative">
              <img
                src={selectedGame.image || "/placeholder.svg"}
                alt={selectedGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="bg-[#FFD700] text-[#0A1A2F] font-bold hover:bg-[#FFD700]/90 text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  <Play className="h-4 w-4 sm:h-6 sm:w-6 mr-2" />
                  Start Playing
                </Button>
              </div>

              {/* Game stats */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 text-white text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{selectedGame.players}</span>
                  </div>
                  <span>Min: {selectedGame.minBet}</span>
                  <span>Max: {selectedGame.maxBet}</span>
                </div>
                <Badge className="bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-xs">
                  {selectedGame.language}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
