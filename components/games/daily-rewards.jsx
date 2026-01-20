"use client"
import { useState } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Gift, Check } from "lucide-react"

export function DailyRewards() {
  const [selectedDay, setSelectedDay] = useState(null)

  const rewards = [
    { day: 1, amount: 100, collected: true },
    { day: 2, amount: 200, collected: true },
    { day: 3, amount: 500, collected: true },
    { day: 4, amount: 1000, collected: false, available: true },
    { day: 5, amount: 2000, collected: false, available: false },
    { day: 6, amount: 5000, collected: false, available: false },
    { day: 7, amount: 10000, collected: false, available: false },
    { day: 8, amount: 50000, collected: false, available: false },
  ]

  const handleCollect = (day) => {
    console.log(`Collecting reward for day ${day}`)
    // Update reward status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-slate-800 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Daily Reward</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
              4056
            </div>
          </div>
        </div>

        {/* Gift Box Animation */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl relative overflow-hidden animate-float">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-yellow-400 rounded-full"></div>
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-8 bg-yellow-400 rounded-full"></div>
              <div className="absolute inset-4 bg-gradient-to-b from-blue-300 to-blue-500 rounded-xl flex items-center justify-center">
                <Gift className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Daily Rewards</h2>
          <p className="text-muted-foreground">Collect your daily bonus and build your streak!</p>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {rewards.map((reward) => (
            <button
              key={reward.day}
              onClick={() => reward.available && !reward.collected && setSelectedDay(reward.day)}
              className={`
                aspect-square rounded-xl border-2 transition-all duration-300 relative overflow-hidden
                ${
                  reward.collected
                    ? "border-green-500 bg-green-500/20"
                    : reward.available
                      ? "border-yellow-400 bg-yellow-400/20 hover:scale-105 animate-pulse-glow"
                      : "border-gray-600 bg-gray-600/20"
                }
              `}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <div className="text-xs font-bold mb-1">Day {reward.day}</div>
                <div className="text-yellow-400 text-xs font-bold">{reward.amount}</div>
                {reward.collected && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                )}
                {reward.available && !reward.collected && (
                  <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* VIP Progress */}
        <div className="glass p-6 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">VIP Progress</h3>
            <span className="text-yellow-400 font-bold">60%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full" style={{ width: "60%" }} />
          </div>
          <p className="text-sm text-muted-foreground">Keep collecting daily rewards to increase your VIP level!</p>
        </div>

        {/* Collect Button */}
        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => handleCollect(selectedDay)}
          disabled={!selectedDay}
        >
          {selectedDay ? `Collect Day ${selectedDay}` : "Select a reward to collect"}
        </AnimatedButton>

        {/* Next Reward Info */}
        <div className="text-center mt-6 text-muted-foreground text-sm">
          <p>Next reward available in 18h 42m</p>
        </div>
      </div>
    </div>
  )
}
