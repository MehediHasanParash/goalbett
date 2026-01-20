"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Bell, Star } from "lucide-react"

export function HomeDashboard() {
  const [userBalance] = useState(125679)

  const recentWins = [
    { game: "Lucky Spin", amount: 850, time: "2m ago" },
    { game: "Slot Machine", amount: 1240, time: "15m ago" },
    { game: "Roulette", time: "1h ago" },
    { game: "Blackjack", amount: 320, time: "2h ago" },
    { game: "Poker", amount: 680, time: "3h ago" },
    { game: "Baccarat", amount: 1100, time: "4h ago" },
  ]

  const quickActions = [
    { title: "Lucky Spin", subtitle: "02 spins", icon: "🎡", color: "from-blue-500 to-cyan-500" },
    { title: "Daily Bonus", subtitle: "02 reward", icon: "🎁", color: "from-purple-500 to-pink-500" },
    { title: "Slot Machine", subtitle: "05 spins", icon: "🎰", color: "from-yellow-500 to-orange-500" },
  ]

  const tableGames = [
    { title: "Roulette", players: "Playing", icon: "🎯" },
    { title: "Dice Roll", players: "Playing", icon: "🎲" },
  ]

  return (
    <div className="pb-20 px-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">CASINO ROYAL</h1>
          <p className="text-muted-foreground">Welcome back, Player!</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
            👨‍💼
          </div>
        </div>
      </div>

      {/* Bonus Banner */}
      <Card3D className="mb-8">
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-6xl opacity-20">🎰</div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-2">Claim up to $1000</p>
            <h2 className="text-xl font-bold mb-4">as a bonus on your first slot!</h2>
            <AnimatedButton variant="primary" size="sm">
              Play Now
            </AnimatedButton>
          </div>
        </div>
      </Card3D>

      {/* Recent Wins */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Recent Wins
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recentWins.map((win, index) => (
            <Card3D key={index} className="flex-shrink-0">
              <div className="glass p-4 rounded-xl min-w-[120px] text-center">
                <div className="text-2xl mb-2">🎮</div>
                <div className="text-sm font-medium mb-1">{win.game}</div>
                {win.amount && <div className="text-green-400 font-bold">${win.amount}</div>}
                <div className="text-xs text-muted-foreground">{win.time}</div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* Play & Earn Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Play & Earn</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card3D key={index}>
              <div className={`glass p-4 rounded-xl text-center bg-gradient-to-br ${action.color}/20`}>
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="text-sm font-bold mb-1">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.subtitle}</div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* Table Games */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Table Games</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {tableGames.map((game, index) => (
            <Card3D key={index}>
              <div className="glass p-6 rounded-xl text-center">
                <div className="text-4xl mb-3">{game.icon}</div>
                <div className="text-sm font-bold mb-1">{game.title}</div>
                <div className="text-xs text-green-400">{game.players}</div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* Balance Display */}
      <Card3D>
        <div className="glass p-6 rounded-2xl text-center">
          <p className="text-muted-foreground mb-2">Your Balance</p>
          <div className="text-3xl font-bold gradient-text mb-4">${userBalance.toLocaleString()}</div>
          <div className="flex gap-3">
            <AnimatedButton variant="primary" size="sm" className="flex-1">
              Deposit
            </AnimatedButton>
            <AnimatedButton variant="glass" size="sm" className="flex-1">
              Withdraw
            </AnimatedButton>
          </div>
        </div>
      </Card3D>
    </div>
  )
}
