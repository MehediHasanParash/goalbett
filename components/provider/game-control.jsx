"use client"

import { useState, useEffect } from "react"
import { Power, Settings, Search, Filter } from "lucide-react"

export default function GameControl() {
  const [gameCategories, setGameCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [gameStatus, setGameStatus] = useState({})

  // Initialize game categories from localStorage
  useEffect(() => {
    const categories = [
      {
        id: "casino",
        name: "Casino",
        description: "Live casino games including roulette, blackjack, and baccarat",
        icon: "🎰",
        games: [
          { id: "live-roulette", name: "Live Roulette", enabled: true },
          { id: "blackjack", name: "Blackjack", enabled: true },
          { id: "baccarat", name: "Baccarat", enabled: true },
          { id: "dragon-tiger", name: "Dragon Tiger", enabled: true },
          { id: "sic-bo", name: "Sic Bo", enabled: true },
        ],
      },
      {
        id: "slots",
        name: "Slots",
        description: "Virtual slot machines with various themes and payouts",
        icon: "🎲",
        games: [
          { id: "treasure-slots", name: "Treasure Slots", enabled: true },
          { id: "jackpot-pro", name: "Jackpot Pro", enabled: true },
          { id: "spin-it-rich", name: "Spin It Rich", enabled: true },
          { id: "lucky-sevens", name: "Lucky Sevens", enabled: true },
          { id: "wild-west", name: "Wild West", enabled: true },
        ],
      },
      {
        id: "virtual",
        name: "Virtual Betting",
        description: "Virtual sports and betting simulations",
        icon: "🏅",
        games: [
          { id: "virtual-football", name: "Virtual Football", enabled: true },
          { id: "virtual-racing", name: "Virtual Racing", enabled: true },
          { id: "virtual-tennis", name: "Virtual Tennis", enabled: true },
          { id: "virtual-cricket", name: "Virtual Cricket", enabled: true },
          { id: "virtual-basketball", name: "Virtual Basketball", enabled: true },
        ],
      },
    ]

    // Load saved state from localStorage
    const savedStatus = localStorage.getItem("gameStatus")
    if (savedStatus) {
      setGameStatus(JSON.parse(savedStatus))
    } else {
      // Initialize all games as enabled
      const initialStatus = {}
      categories.forEach((cat) => {
        cat.games.forEach((game) => {
          initialStatus[game.id] = game.enabled
        })
      })
      setGameStatus(initialStatus)
    }

    setGameCategories(categories)
  }, [])

  // Save status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("gameStatus", JSON.stringify(gameStatus))
  }, [gameStatus])

  const toggleGame = (gameId) => {
    setGameStatus((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  const toggleCategoryAll = (categoryId) => {
    const category = gameCategories.find((cat) => cat.id === categoryId)
    if (!category) return

    const allEnabled = category.games.every((game) => gameStatus[game.id])
    const newStatus = {}
    category.games.forEach((game) => {
      newStatus[game.id] = !allEnabled
    })

    setGameStatus((prev) => ({
      ...prev,
      ...newStatus,
    }))
  }

  const getCategoryStats = (categoryId) => {
    const category = gameCategories.find((cat) => cat.id === categoryId)
    if (!category) return { enabled: 0, total: 0 }

    const enabled = category.games.filter((game) => gameStatus[game.id]).length
    return { enabled, total: category.games.length }
  }

  const filteredCategories = gameCategories.filter((cat) => {
    if (filterType !== "all" && cat.id !== filterType) return false
    if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Power className="w-8 h-8 text-[#FFD700]" />
          <h2 className="text-3xl font-bold text-foreground">Game Control Center</h2>
        </div>
        <p className="text-muted-foreground">Manage and toggle games on/off by category</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-64 relative">
          <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search game categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="casino">Casino Only</option>
            <option value="slots">Slots Only</option>
            <option value="virtual">Virtual Betting Only</option>
          </select>
        </div>
      </div>

      {/* Game Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category) => {
          const stats = getCategoryStats(category.id)
          const allEnabled = stats.enabled === stats.total
          const allDisabled = stats.enabled === 0

          return (
            <div
              key={category.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-secondary/50 transition-colors"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-secondary/20 to-secondary/10 border-b border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCategoryAll(category.id)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      allEnabled ? "bg-green-500/80" : allDisabled ? "bg-red-500/80" : "bg-yellow-500/80"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                        allEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
                      {allEnabled ? "ON" : allDisabled ? "OFF" : ""}
                    </span>
                  </button>
                </div>

                {/* Category Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-muted-foreground">
                        Enabled: <span className="font-semibold text-foreground">{stats.enabled}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-muted-foreground">
                        Disabled: <span className="font-semibold text-foreground">{stats.total - stats.enabled}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {Math.round((stats.enabled / stats.total) * 100)}% Active
                  </div>
                </div>
              </div>

              {/* Games List */}
              <div className="divide-y divide-border">
                {category.games.map((game) => {
                  const isEnabled = gameStatus[game.id]
                  return (
                    <div
                      key={game.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full transition-colors ${
                            isEnabled ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <span className="font-medium text-foreground text-sm">{game.name}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            isEnabled ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {isEnabled ? "Live" : "Offline"}
                        </span>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleGame(game.id)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          isEnabled ? "bg-green-500/80" : "bg-gray-400/80"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                            isEnabled ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Category Footer */}
              <div className="bg-muted/50 px-6 py-3 flex items-center justify-between text-xs">
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Settings size={16} />
                  Configure
                </button>
                <span className="text-muted-foreground">Last updated: just now</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[
          { label: "Total Games", value: gameCategories.reduce((sum, cat) => sum + cat.games.length, 0), icon: "🎮" },
          {
            label: "Enabled",
            value: Object.values(gameStatus).filter(Boolean).length,
            icon: "✅",
          },
          { label: "Disabled", value: Object.values(gameStatus).filter((v) => !v).length, icon: "❌" },
        ].map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
