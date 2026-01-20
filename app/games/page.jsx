"use client"
import { useState } from "react"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { SpinWheel } from "@/components/games/spin-wheel"
import { SlotMachine } from "@/components/games/slot-machine"
import { Roulette } from "@/components/games/roulette"
import { WinScreen } from "@/components/games/win-screen"
import { DailyRewards } from "@/components/games/daily-rewards"
import { useLanguage } from "@/lib/i18n/language-context"

export default function GamesPage() {
  const { isLoading: tenantLoading, primaryColor } = useTenant()
  const { isAuthenticated, loading } = useAuth()
  const { t } = useLanguage()
  const [currentGame, setCurrentGame] = useState("menu")

  const accentColor = primaryColor || "#FFD700"

  if (loading || tenantLoading) return null

  const games = [
    { id: "spin-wheel", name: t("spinWheel"), icon: "🎡", component: SpinWheel },
    { id: "slot-machine", name: t("slotMachine"), icon: "��", component: SlotMachine },
    { id: "roulette", name: t("roulette"), icon: "🎯", component: Roulette },
    { id: "win-screen", name: t("winScreen"), icon: "🏆", component: WinScreen },
    { id: "daily-rewards", name: t("dailyRewards"), icon: "🎁", component: DailyRewards },
  ]

  if (currentGame !== "menu") {
    const game = games.find((g) => g.id === currentGame)
    if (game) {
      const GameComponent = game.component
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
          <BettingHeader />
          <div className="pt-28 pb-24 container mx-auto px-4">
            <button
              onClick={() => setCurrentGame("menu")}
              className="mb-4 hover:underline"
              style={{ color: accentColor }}
            >
              ← {t("backToGames")}
            </button>
            <GameComponent />
          </div>
          {isAuthenticated && <BottomNavigation activeTab="casino" />}
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
      <BettingHeader />
      <div className="pt-28 pb-24 container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: accentColor }}>
            {t("casinoGames")}
          </h1>
          <p className="text-lg text-[#B8C5D6]">{t("chooseYourGame")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setCurrentGame(game.id)}
              className="bg-[#1A2F45] border border-[#2A3F55] p-8 rounded-2xl transition-all duration-300 hover:scale-105 group"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accentColor}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A3F55")}
            >
              <div className="text-6xl mb-4 group-hover:animate-bounce">{game.icon}</div>
              <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: accentColor }}>
                {game.name}
              </h3>
              <p className="text-[#B8C5D6]">{t("clickToPlay")}</p>
            </button>
          ))}
        </div>
      </div>
      {isAuthenticated && <BottomNavigation activeTab="casino" />}
    </div>
  )
}
