"use client"
import { useState } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"

export function WinScreen({ winAmount = 1000, onPlayAgain, onCollect }) {
  const [showConfetti, setShowConfetti] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-slate-800 p-6 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">You Win</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
              4056
            </div>
          </div>
        </div>

        {/* Win Animation */}
        <div className="text-center mb-8">
          <div className="relative mb-8">
            <div className="w-48 h-48 mx-auto relative">
              {/* Treasure Chest */}
              <div className="w-full h-full bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-2xl relative overflow-hidden animate-pulse-glow">
                <div className="absolute inset-4 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-xl">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-6xl animate-bounce">💰</div>
                  </div>
                </div>
                {/* Coins spilling out */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div
                    className="w-6 h-6 bg-yellow-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-bold gradient-text mb-4 animate-scale-in">Congratulations!</h2>
          <p className="text-muted-foreground mb-6 animate-slide-up">You've won!</p>

          {/* Win Amount */}
          <div className="glass p-8 rounded-2xl mb-8 animate-scale-in">
            <div className="text-6xl font-bold text-green-400 mb-2">${winAmount.toLocaleString()}</div>
            <p className="text-muted-foreground">The amount has been added to your balance.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onPlayAgain || (() => (window.location.href = "/games"))}
          >
            Play Again
          </AnimatedButton>
          <AnimatedButton
            variant="gold"
            size="lg"
            className="w-full"
            onClick={onCollect || (() => (window.location.href = "/dashboard"))}
          >
            Collect
          </AnimatedButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-primary">15</div>
            <div className="text-sm text-muted-foreground">Games Won Today</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-400">$5,420</div>
            <div className="text-sm text-muted-foreground">Total Winnings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
