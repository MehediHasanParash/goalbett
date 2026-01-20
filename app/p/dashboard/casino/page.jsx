"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Zap, Crown, Gem, Trophy, Search, UserCircle, MenuIcon, X, Wallet } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { AnimatedButton } from "@/components/ui/animated-button"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { BetSlip } from "@/components/dashboard/bet-slip"

export default function DashboardCasinoPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/casino")
  }, [router])

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Games")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [betSlipOpen, setBetSlipOpen] = useState(false)

  const categories = [
    { id: "All Games", name: "All Games", icon: null },
    { id: "Slots", name: "Slots", icon: "🎰" },
    { id: "Live Casino", name: "Live Casino", icon: "🎭" },
    { id: "Table Games", name: "Table Games", icon: "🃏" },
    { id: "Jackpots", name: "Jackpots", icon: "💎" },
    { id: "New", name: "New", icon: "⭐" },
  ]

  const featuredGames = [
    {
      title: "Mega Fortune Dreams",
      category: "Jackpots",
      jackpot: "$2,847,392",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      featured: true,
      hot: true,
    },
    {
      title: "Lightning Roulette",
      category: "Live Casino",
      players: "1,247",
      image: "/casino-roulette-table.jpg",
      url: "/dashboard/casino/live-casino",
      featured: true,
      live: true,
    },
  ]

  const games = [
    {
      title: "Spin It Rich!",
      category: "Slots",
      players: "2.5K",
      image: "/casino-spin-wheel.jpg",
      url: "/dashboard/casino/spin-it-rich",
      rtp: "96.5%",
    },
    {
      title: "Treasures",
      category: "Slots",
      players: "1.8K",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/treasures",
      rtp: "95.8%",
    },
    {
      title: "Vegas Slots",
      category: "Slots",
      players: "3.2K",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/slots",
      rtp: "97.1%",
      hot: true,
    },
    {
      title: "European Roulette",
      category: "Table Games",
      players: "950",
      image: "/casino-roulette-table.jpg",
      url: "/dashboard/casino/roulette",
      rtp: "97.3%",
    },
    {
      title: "Spin Wheel",
      category: "Slots",
      players: "1.2K",
      image: "/casino-spin-wheel.jpg",
      url: "/dashboard/casino/spin-wheel",
      rtp: "94.2%",
    },
    {
      title: "Live Casino",
      category: "Live Casino",
      players: "4.5K",
      image: "/casino-roulette-table.jpg",
      url: "/dashboard/casino/live-casino",
      rtp: "98.5%",
      new: true,
    },
    {
      title: "Jackpots",
      category: "Jackpots",
      players: "6.2K",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/jackpots",
      rtp: "95.2%",
      hot: true,
    },
    {
      title: "Jackpots Pro",
      category: "Jackpots",
      players: "8.9K",
      image: "/slot-machine-casino.png",
      url: "/dashboard/casino/jackpots-pro",
      rtp: "96.8%",
      hot: true,
    },
  ]

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All Games" || game.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0A1A2F]/95 to-[#0A1A2F]/90 text-white relative overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1A2F]/95 backdrop-blur-sm border-b border-[#2A3F55]">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2 border-b border-[#2A3F55]">
            <div className="flex items-center space-x-2 md:space-x-6">
              <Logo size="large" />
              <nav className="hidden lg:flex items-center space-x-6 text-sm">
                <Link href="/dashboard" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  Sports
                </Link>
                <Link href="/dashboard/in-play" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  In-Play
                </Link>
                <Link href="/casino" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  Casino
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/dashboard/wallet" className="sm:inline">
                <Wallet className="w-7 h-7 text-[#FFD700] hover:text-[#FFD700]/70" />
              </Link>

              <span className="hidden md:inline text-[#B8C5D6] text-sm">Responsible Gambling</span>
              <span className="hidden sm:inline text-[#B8C5D6] text-sm">Help</span>

              <Link href="/auth" className="hidden sm:inline">
                <UserCircle className="w-7 h-7 text-[#FFD700] hover:text-[#FFD700]/70" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#B8C5D6] hover:text-[#FFD700]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-b border-[#2A3F55]">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/dashboard"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sports
                </Link>
                <Link
                  href="/dashboard/in-play"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  In-Play
                </Link>
                <Link
                  href="/casino"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Casino
                </Link>
                <div className="flex flex-col space-y-2 pt-2 sm:hidden">
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <AnimatedButton
                      variant="glass"
                      className="text-[#F5F5F5] border-[#2A3F55] flex items-center justify-center hover:border-[#FFD700] w-full"
                      size="sm"
                    >
                      <UserCircle className="w-7 h-7 text-[#FFD700] hover:text-[#FFD700]/70" />
                    </AnimatedButton>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          {/* Main Navigation */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8"></div>
              <div className="flex items-center space-x-4 flex-1 justify-end">
                <div className="relative w-full max-w-xs md:max-w-md lg:max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8C5D6]" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-10 pr-4 py-2 w-full bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6] focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="container mt-10 mx-auto px-3 sm:px-4 lg:px-6 pt-32 sm:pt-36 pb-20 sm:pb-24">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? "bg-[#FFD700] text-[#0A1A2F] shadow-lg shadow-[#FFD700]/20"
                  : "bg-[#0A1A2F]/50 border border-[#FFD700]/20 text-[#F5F5F5] hover:bg-[#FFD700]/10"
              }`}
            >
              {category.icon && <span className="text-base">{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>

        {/* Featured Games */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#FFD700] flex items-center gap-2">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
            Featured Games
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {featuredGames.map((game, index) => (
              <Link key={index} href={game.url}>
                <div className="rounded-lg bg-[#0A1A2F]/60 border border-[#FFD700]/30 hover:border-[#FFD700]/60 transition-all duration-300 overflow-hidden group shadow-xl">
                  <div className="p-0 relative">
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-[#0A1A2F]/50 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
                        {game.featured && (
                          <Badge className="bg-[#FFD700] text-[#0A1A2F] font-bold text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            FEATURED
                          </Badge>
                        )}
                        {game.hot && (
                          <Badge className="bg-red-500 text-white animate-pulse text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            HOT
                          </Badge>
                        )}
                        {game.live && (
                          <Badge className="bg-green-500 text-white text-xs">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                        <h3 className="text-base sm:text-xl font-bold text-white mb-2">{game.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#F5F5F5]/70 text-xs sm:text-sm">{game.category}</span>
                          {game.jackpot ? (
                            <div className="text-right">
                              <div className="text-xs text-[#FFD700]">JACKPOT</div>
                              <div className="text-sm sm:text-lg font-bold text-[#FFD700]">{game.jackpot}</div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-xs text-[#F5F5F5]/70">Players</div>
                              <div className="text-xs sm:text-sm font-bold text-white">{game.players}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Games */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#FFD700] flex items-center gap-2">
            <Gem className="h-4 w-4 sm:h-5 sm:w-5" />
            All Games
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredGames.map((game, index) => (
              <Link key={index} href={game.url}>
                <div className="rounded-lg bg-[#0A1A2F]/60 border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all duration-300 overflow-hidden group shadow-lg">
                  <div className="p-0 relative">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col gap-1">
                        {game.hot && <Badge className="bg-red-500 text-white text-xs animate-pulse">HOT</Badge>}
                        {game.new && <Badge className="bg-green-500 text-white text-xs">NEW</Badge>}
                      </div>

                      {/* RTP */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                        <Badge className="bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-xs">
                          {game.rtp}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                        <h3 className="text-white font-bold text-xs sm:text-sm mb-1 truncate">{game.title}</h3>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#F5F5F5]/70 truncate">{game.category}</span>
                          <span className="text-[#FFD700]">{game.players}</span>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#FFD700]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-[#FFD700] text-[#0A1A2F] font-bold hover:bg-[#FFD700]/90 text-xs sm:text-sm">
                          Play Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 text-[#0A1A2F] py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-bold text-xs sm:text-sm">MEGA JACKPOT: $2,847,392</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-bold text-xs sm:text-sm">DAILY JACKPOT: $47,293</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-bold text-xs sm:text-sm">HOURLY JACKPOT: $3,847</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation onBetSlipClick={() => setBetSlipOpen(true)} betSlipCount={2} />
      <BetSlip isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
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
