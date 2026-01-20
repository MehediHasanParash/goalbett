"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Zap, Crown, Gem, Trophy, Search, Sparkles, Play, Gift, Flame, Diamond } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { useThemeColors } from "@/hooks/useThemeColors"

export function CasinoContent() {
  const { brandName } = useTenant()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Games")
  const { t, locale } = useLanguage()
  const { colors, currentTheme } = useThemeColors()

  const [jackpotTicker, setJackpotTicker] = useState({
    enabled: true,
    megaJackpot: { label: "MEGA JACKPOT", amount: 2847392, isActive: true },
    dailyJackpot: { label: "DAILY JACKPOT", amount: 47293, isActive: true },
    hourlyJackpot: { label: "HOURLY JACKPOT", amount: 3847, isActive: true },
    autoIncrement: { enabled: true, megaRate: 50, dailyRate: 10, hourlyRate: 5, intervalSeconds: 3 },
  })

  const [displayAmounts, setDisplayAmounts] = useState({
    mega: 2847392,
    daily: 47293,
    hourly: 3847,
  })

  useEffect(() => {
    const fetchJackpotTicker = async () => {
      try {
        const response = await fetch("/api/jackpot-ticker")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.jackpotTicker) {
            setJackpotTicker(data.jackpotTicker)
            setDisplayAmounts({
              mega: data.jackpotTicker.megaJackpot?.amount || 2847392,
              daily: data.jackpotTicker.dailyJackpot?.amount || 47293,
              hourly: data.jackpotTicker.hourlyJackpot?.amount || 3847,
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch jackpot ticker:", error)
      }
    }
    fetchJackpotTicker()
  }, [])

  useEffect(() => {
    if (!jackpotTicker.autoIncrement?.enabled) return
    const interval = setInterval(
      () => {
        setDisplayAmounts((prev) => ({
          mega: prev.mega + (jackpotTicker.autoIncrement?.megaRate || 50),
          daily: prev.daily + (jackpotTicker.autoIncrement?.dailyRate || 10),
          hourly: prev.hourly + (jackpotTicker.autoIncrement?.hourlyRate || 5),
        }))
      },
      (jackpotTicker.autoIncrement?.intervalSeconds || 3) * 1000,
    )
    return () => clearInterval(interval)
  }, [jackpotTicker.autoIncrement])

  const formatAmount = (amount) => Number.parseInt(amount).toLocaleString()

  const categories = [
    { id: "All Games", name: t("allGames"), icon: null },
    { id: "Slots", name: t("slots"), icon: "🎰" },
    { id: "Live Casino", name: t("liveCasino"), icon: "🎭" },
    { id: "Table Games", name: t("tableGames"), icon: "🃏" },
    { id: "Jackpots", name: t("jackpots"), icon: "💎" },
    { id: "New", name: t("new"), icon: "⭐" },
  ]

  const featuredGames = [
    {
      title: "Mega Fortune Dreams",
      category: "Jackpots",
      jackpot: "$2,847,392",
      image: "/slot-machine-casino.png",
      url: "/casino/slots",
      featured: true,
      hot: true,
    },
    {
      title: "Lightning Roulette",
      category: "Live Casino",
      players: "1,247",
      image: "/casino-roulette-table.jpg",
      url: "/casino/live-casino",
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
      url: "/casino/spin-it-rich",
      rtp: "96.5%",
    },
    {
      title: "Treasures",
      category: "Slots",
      players: "1.8K",
      image: "/slot-machine-casino.png",
      url: "/casino/treasures",
      rtp: "95.8%",
    },
    {
      title: "Vegas Slots",
      category: "Slots",
      players: "3.2K",
      image: "/slot-machine-casino.png",
      url: "/casino/slots",
      rtp: "97.1%",
      hot: true,
    },
    {
      title: "European Roulette",
      category: "Table Games",
      players: "950",
      image: "/casino-roulette-table.jpg",
      url: "/casino/roulette",
      rtp: "97.3%",
    },
    {
      title: "Spin Wheel",
      category: "Slots",
      players: "1.2K",
      image: "/casino-spin-wheel.jpg",
      url: "/casino/spin-wheel",
      rtp: "94.2%",
    },
    {
      title: "Live Casino",
      category: "Live Casino",
      players: "4.5K",
      image: "/casino-roulette-table.jpg",
      url: "/casino/live-casino",
      rtp: "98.5%",
      new: true,
    },
    {
      title: "Jackpots",
      category: "Jackpots",
      players: "6.2K",
      image: "/slot-machine-casino.png",
      url: "/casino/jackpots",
      rtp: "95.2%",
      hot: true,
    },
    {
      title: "Jackpots Pro",
      category: "Jackpots",
      players: "8.9K",
      image: "/slot-machine-casino.png",
      url: "/casino/jackpots-pro",
      rtp: "96.8%",
      hot: true,
    },
  ]

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All Games" || game.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (currentTheme === "modern") {
    return (
      <ModernCasino
        categories={categories}
        featuredGames={featuredGames}
        filteredGames={filteredGames}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        displayAmounts={displayAmounts}
        formatAmount={formatAmount}
        jackpotTicker={jackpotTicker}
        colors={colors}
        t={t}
      />
    )
  }

  if (currentTheme === "neon") {
    return (
      <NeonCasino
        categories={categories}
        featuredGames={featuredGames}
        filteredGames={filteredGames}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        displayAmounts={displayAmounts}
        formatAmount={formatAmount}
        jackpotTicker={jackpotTicker}
        colors={colors}
        t={t}
      />
    )
  }

  // Classic Theme
  return (
    <ClassicCasino
      categories={categories}
      featuredGames={featuredGames}
      filteredGames={filteredGames}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      displayAmounts={displayAmounts}
      formatAmount={formatAmount}
      jackpotTicker={jackpotTicker}
      colors={colors}
      t={t}
    />
  )
}

function ClassicCasino({
  categories,
  featuredGames,
  filteredGames,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  displayAmounts,
  formatAmount,
  jackpotTicker,
  colors,
  t,
}) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
            style={{ color: colors.textMuted }}
          />
          <input
            type="text"
            placeholder={t("searchGames")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none"
            style={{ backgroundColor: colors.bgMuted, border: `1px solid ${colors.border}`, color: colors.text }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all`}
            style={{
              backgroundColor: activeCategory === category.id ? colors.accent : `${colors.bgDark}80`,
              color: activeCategory === category.id ? colors.accentForeground : colors.text,
              border: `1px solid ${activeCategory === category.id ? colors.accent : `${colors.accent}20`}`,
            }}
          >
            {category.icon && <span className="text-base">{category.icon}</span>}
            {category.name}
          </button>
        ))}
      </div>

      {/* Featured Games */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
          <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("featuredGames")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {featuredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div
                className="rounded-lg overflow-hidden group shadow-xl transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: `${colors.bgDark}60`, border: `1px solid ${colors.accent}30` }}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${colors.bgDark}, ${colors.bgDark}80, transparent)` }}
                  />
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
                    {game.featured && (
                      <Badge
                        style={{ backgroundColor: colors.accent, color: colors.accentForeground }}
                        className="font-bold text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {t("featured")}
                      </Badge>
                    )}
                    {game.hot && (
                      <Badge className="bg-red-500 text-white animate-pulse text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {t("hot")}
                      </Badge>
                    )}
                    {game.live && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                        {t("live")}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="text-base sm:text-xl font-bold text-white mb-2">{game.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm" style={{ color: `${colors.text}70` }}>
                        {game.category}
                      </span>
                      {game.jackpot ? (
                        <div className="text-right">
                          <div className="text-xs" style={{ color: colors.accent }}>
                            {t("jackpot")}
                          </div>
                          <div className="text-sm sm:text-lg font-bold" style={{ color: colors.accent }}>
                            {game.jackpot}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-xs" style={{ color: `${colors.text}70` }}>
                            {t("players")}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-white">{game.players}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Games */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2" style={{ color: colors.accent }}>
          <Gem className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("allGames")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div
                className="rounded-lg overflow-hidden group shadow-lg transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: `${colors.bgDark}60`, border: `1px solid ${colors.accent}20` }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${colors.bgDark}, transparent, transparent)` }}
                  />
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col gap-1">
                    {game.hot && <Badge className="bg-red-500 text-white text-xs animate-pulse">{t("hot")}</Badge>}
                    {game.new && <Badge className="bg-green-500 text-white text-xs">{t("new")}</Badge>}
                  </div>
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${colors.accent}20`,
                        border: `1px solid ${colors.accent}50`,
                        color: colors.accent,
                      }}
                    >
                      {game.rtp}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm mb-1 truncate">{game.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: `${colors.text}70` }} className="truncate">
                        {game.category}
                      </span>
                      <span style={{ color: colors.accent }}>{game.players}</span>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <Button
                      style={{ backgroundColor: colors.accent, color: colors.accentForeground }}
                      className="font-bold text-xs sm:text-sm"
                    >
                      {t("playNow")}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {jackpotTicker.enabled && (
        <div
          className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 py-2 overflow-hidden"
          style={{ background: `linear-gradient(to right, ${colors.accent}, ${colors.accent}CC)` }}
        >
          <div
            className="animate-marquee whitespace-nowrap flex items-center space-x-4 sm:space-x-8"
            style={{ color: colors.accentForeground }}
          >
            {jackpotTicker.megaJackpot?.isActive && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-bold text-xs sm:text-sm">
                  {jackpotTicker.megaJackpot.label}: ${formatAmount(displayAmounts.mega)}
                </span>
              </div>
            )}
            {jackpotTicker.dailyJackpot?.isActive && (
              <div className="flex items-center space-x-2">
                <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-bold text-xs sm:text-sm">
                  {jackpotTicker.dailyJackpot.label}: ${formatAmount(displayAmounts.daily)}
                </span>
              </div>
            )}
            {jackpotTicker.hourlyJackpot?.isActive && (
              <div className="flex items-center space-x-2">
                <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-bold text-xs sm:text-sm">
                  {jackpotTicker.hourlyJackpot.label}: ${formatAmount(displayAmounts.hourly)}
                </span>
              </div>
            )}
            {jackpotTicker.megaJackpot?.isActive && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-bold text-xs sm:text-sm">
                  {jackpotTicker.megaJackpot.label}: ${formatAmount(displayAmounts.mega)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function ModernCasino({
  categories,
  featuredGames,
  filteredGames,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  displayAmounts,
  formatAmount,
  jackpotTicker,
  colors,
  t,
}) {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Modern Hero */}
      <div
        className="relative mb-10 p-10 rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-pink-300/20 to-rose-300/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1.5 text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Premium Gaming
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">Casino & Games</h1>
            <p className="text-gray-600 text-lg max-w-md">
              Experience world-class casino entertainment with premium slots, live dealers, and massive jackpots.
            </p>
          </div>
          <div className="flex gap-4">
            {[
              { label: "Mega Jackpot", amount: displayAmounts.mega, icon: Crown, color: "violet" },
              { label: "Daily Prize", amount: displayAmounts.daily, icon: Gift, color: "pink" },
            ].map((jp, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50">
                <jp.icon className={`w-8 h-8 mb-2 ${jp.color === "violet" ? "text-violet-600" : "text-pink-500"}`} />
                <p className="text-sm text-gray-500">{jp.label}</p>
                <p className={`text-2xl font-black ${jp.color === "violet" ? "text-violet-600" : "text-pink-500"}`}>
                  ${formatAmount(jp.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchGames")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3.5 w-full bg-white rounded-2xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
              }`}
            >
              {category.icon && <span>{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Games - Bento Style */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900">Featured Games</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:border-violet-200 transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {game.featured && (
                      <Badge className="bg-white/90 text-violet-600 font-semibold">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {game.hot && (
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                        <Flame className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                    {game.live && (
                      <Badge className="bg-green-500 text-white">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5" />
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{game.category}</span>
                      {game.jackpot && <span className="text-xl font-bold text-violet-300">{game.jackpot}</span>}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">{game.players || "2K+"} playing</span>
                  </div>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                    Play Now
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Games Grid */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900">All Games</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-violet-200 transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {game.hot && <Badge className="bg-red-500 text-white text-[10px]">HOT</Badge>}
                    {game.new && <Badge className="bg-green-500 text-white text-[10px]">NEW</Badge>}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-violet-600 text-[10px] font-semibold">{game.rtp}</Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-sm truncate">{game.title}</h3>
                    <p className="text-gray-400 text-xs">{game.category}</p>
                  </div>
                  <div className="absolute inset-0 bg-violet-600/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <Button size="sm" className="bg-white text-violet-600 font-bold rounded-xl">
                      <Play className="w-4 h-4 mr-1" /> Play
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Modern Jackpot Ticker */}
      {jackpotTicker.enabled && (
        <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 py-3 shadow-lg">
            <div className="animate-marquee whitespace-nowrap flex items-center space-x-12 text-white">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">MEGA JACKPOT: ${formatAmount(displayAmounts.mega)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                <span className="font-bold">DAILY: ${formatAmount(displayAmounts.daily)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5" />
                <span className="font-bold">HOURLY: ${formatAmount(displayAmounts.hourly)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">MEGA JACKPOT: ${formatAmount(displayAmounts.mega)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  )
}

function NeonCasino({
  categories,
  featuredGames,
  filteredGames,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  displayAmounts,
  formatAmount,
  jackpotTicker,
  colors,
  t,
}) {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Neon Hero */}
      <div
        className="relative mb-10 p-10 rounded-2xl overflow-hidden border border-cyan-500/30"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1.5 text-sm font-bold mb-4 border-0 font-mono">
              <Diamond className="w-4 h-4 mr-2" />
              PREMIUM_ACCESS
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3 tracking-tight">
              CASINO
            </h1>
            <p className="text-cyan-400/70 text-lg font-mono tracking-wide">// NEXT_GEN GAMING EXPERIENCE</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "MEGA_POT", amount: displayAmounts.mega, color: "cyan" },
              { label: "DAILY_POT", amount: displayAmounts.daily, color: "purple" },
            ].map((jp, idx) => (
              <div
                key={idx}
                className="relative p-5 rounded-xl border backdrop-blur-sm overflow-hidden"
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderColor: jp.color === "cyan" ? "rgba(6, 182, 212, 0.3)" : "rgba(168, 85, 247, 0.3)",
                }}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${jp.color === "cyan" ? "from-cyan-500 to-blue-500" : "from-purple-500 to-pink-500"}`}
                />
                <p className="text-xs text-gray-500 font-mono tracking-widest mb-1">{jp.label}</p>
                <p
                  className={`text-2xl font-black font-mono ${jp.color === "cyan" ? "text-cyan-400" : "text-purple-400"}`}
                >
                  ${formatAmount(jp.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neon Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-500" />
          <input
            type="text"
            placeholder="SEARCH_GAMES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3.5 w-full rounded-xl text-cyan-400 placeholder-cyan-700 focus:outline-none font-mono"
            style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(6, 182, 212, 0.3)" }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300 font-mono tracking-wide ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                  : "border text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10"
              }`}
              style={{
                borderColor: activeCategory === category.id ? "transparent" : "rgba(6, 182, 212, 0.2)",
                background: activeCategory === category.id ? undefined : "rgba(15, 23, 42, 0.8)",
                clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
              }}
            >
              {category.icon && <span>{category.icon}</span>}
              {category.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Games - Neon Cards */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6 font-mono tracking-tight">
          &gt; FEATURED_GAMES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div
                className="group relative rounded-xl overflow-hidden border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100" />
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {game.featured && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-mono text-xs">
                        [FEATURED]
                      </Badge>
                    )}
                    {game.hot && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/50 font-mono text-xs animate-pulse">
                        [HOT]
                      </Badge>
                    )}
                    {game.live && (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 font-mono text-xs">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" />
                        [LIVE]
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-black text-white mb-2">{game.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400/70 font-mono text-sm">{game.category}</span>
                      {game.jackpot && (
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">
                          {game.jackpot}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between border-t border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-400/60 font-mono text-sm">
                    <Play className="w-4 h-4" />
                    {game.players || "2K+"}_ONLINE
                  </div>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold font-mono hover:shadow-lg hover:shadow-cyan-500/30">
                    PLAY_NOW
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Games Grid */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 font-mono tracking-tight">
          &gt; ALL_GAMES
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredGames.map((game, index) => (
            <Link key={index} href={game.url}>
              <div
                className="group relative rounded-xl overflow-hidden border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105"
                style={{ background: "rgba(15, 23, 42, 0.9)" }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {game.hot && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono">
                        HOT
                      </Badge>
                    )}
                    {game.new && (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-mono">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                      {game.rtp}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="text-white font-bold text-xs truncate">{game.title}</h3>
                    <p className="text-cyan-400/60 text-[10px] font-mono">{game.category}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                    <Button
                      size="sm"
                      className="bg-white/10 text-white border border-white/30 font-mono text-xs hover:bg-white/20"
                    >
                      <Play className="w-3 h-3 mr-1" /> RUN
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Neon Jackpot Ticker */}
      {jackpotTicker.enabled && (
        <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40">
          <div
            className="py-3 border-t border-b border-cyan-500/30"
            style={{
              background:
                "linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))",
            }}
          >
            <div className="animate-marquee whitespace-nowrap flex items-center space-x-12 font-mono">
              <div className="flex items-center gap-2 text-cyan-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">MEGA_JACKPOT: ${formatAmount(displayAmounts.mega)}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Crown className="w-5 h-5" />
                <span className="font-bold">DAILY: ${formatAmount(displayAmounts.daily)}</span>
              </div>
              <div className="flex items-center gap-2 text-pink-400">
                <Gem className="w-5 h-5" />
                <span className="font-bold">HOURLY: ${formatAmount(displayAmounts.hourly)}</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">MEGA_JACKPOT: ${formatAmount(displayAmounts.mega)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  )
}
