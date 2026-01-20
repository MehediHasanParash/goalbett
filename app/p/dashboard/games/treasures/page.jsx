"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, Play, Trophy, Gem } from "lucide-react"
import Link from "next/link"
import { FloatingElements } from "@/components/ui/floating-elements"
import { LightningParticles } from "@/components/ui/lightning-particles"

const symbols = ["💎", "👑", "🏆", "💰", "⭐", "🎰", "🍀", "🔥"]
const payouts = {
  "💎💎💎": 1000,
  "👑👑👑": 500,
  "🏆🏆🏆": 250,
  "💰💰💰": 100,
  "⭐⭐⭐": 50,
  "🎰🎰🎰": 25,
  "🍀🍀🍀": 15,
  "🔥🔥🔥": 10,
}

export default function TreasuresGame() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(50)
  const [balance, setBalance] = useState(18000)
  const [reels, setReels] = useState([
    ["💎", "👑", "🏆"],
    ["💰", "⭐", "🎰"],
    ["🍀", "🔥", "💎"],
  ])
  const [lastWin, setLastWin] = useState(null)
  const [spinsLeft, setSpinsLeft] = useState(15)
  const [jackpot, setJackpot] = useState(125000)
  const reelRefs = useRef([])

  const spinReels = () => {
    if (isSpinning || spinsLeft <= 0 || betAmount > balance) return

    setIsSpinning(true)
    setSpinsLeft((prev) => prev - 1)
    setBalance((prev) => prev - betAmount)
    setJackpot((prev) => prev + betAmount * 0.1) // 10% goes to jackpot

    // Animate each reel
    reelRefs.current.forEach((reel, index) => {
      if (reel) {
        reel.style.animation = `spin-reel 2s ease-out ${index * 0.2}s`
      }
    })

    setTimeout(() => {
      // Generate new symbols
      const newReels = Array(3)
        .fill()
        .map(() =>
          Array(3)
            .fill()
            .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
        )
      setReels(newReels)

      // Check for wins
      const middleRow = newReels.map((reel) => reel[1]).join("")
      const winAmount = payouts[middleRow] ? betAmount * payouts[middleRow] : 0

      // Jackpot check (very rare)
      const isJackpot = middleRow === "💎💎💎" && Math.random() < 0.01
      const finalWin = isJackpot ? jackpot : winAmount

      if (finalWin > 0) {
        setBalance((prev) => prev + finalWin)
        setLastWin({
          amount: finalWin,
          combination: middleRow,
          isJackpot: isJackpot,
        })
        if (isJackpot) setJackpot(50000) // Reset jackpot
      } else {
        setLastWin(null)
      }

      setIsSpinning(false)
    }, 3000)
  }

  const adjustBet = (amount) => {
    setBetAmount((prev) => Math.max(10, Math.min(1000, prev + amount)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-slate-800 relative overflow-hidden">
      <FloatingElements />
      <LightningParticles />

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                TREASURES
              </h1>
              <p className="text-sm text-muted-foreground">Hunt for Hidden Riches</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
              Balance: ${balance.toLocaleString()}
            </Badge>
          </div>

          {/* Jackpot Display */}
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-yellow-400 mb-1">PROGRESSIVE JACKPOT</div>
              <div className="text-3xl font-bold text-yellow-400 animate-pulse">${jackpot.toLocaleString()}</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Slot Machine */}
            <div className="xl:col-span-3">
              <Card className="bg-slate-800/50 border-purple-500/30 shadow-2xl shadow-purple-500/20">
                <CardContent className="p-8">
                  <div className="bg-black/50 rounded-lg p-6 border-2 border-yellow-400">
                    {/* Reels */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {reels.map((reel, reelIndex) => (
                        <div key={reelIndex} className="space-y-2">
                          {reel.map((symbol, symbolIndex) => (
                            <div
                              key={symbolIndex}
                              ref={(el) => {
                                if (!reelRefs.current[reelIndex]) reelRefs.current[reelIndex] = el
                              }}
                              className={`h-20 w-20 mx-auto bg-slate-700 rounded-lg flex items-center justify-center text-4xl border-2 ${
                                symbolIndex === 1
                                  ? "border-yellow-400 shadow-lg shadow-yellow-400/50"
                                  : "border-slate-600"
                              } transition-all duration-300`}
                            >
                              {symbol}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Payline indicator */}
                    <div className="absolute left-8 right-8 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Betting */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gem className="h-5 w-5 text-purple-400" />
                    Bet Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bet Amount</span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => adjustBet(-10)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg w-16 text-center text-purple-400">${betAmount}</span>
                      <Button size="sm" variant="outline" onClick={() => adjustBet(10)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[25, 50, 100, 250].map((amount) => (
                      <Button
                        key={amount}
                        size="sm"
                        variant={betAmount === amount ? "default" : "outline"}
                        onClick={() => setBetAmount(amount)}
                        className={betAmount === amount ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={spinReels}
                    disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                  >
                    {isSpinning ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        SPINNING...
                      </div>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        SPIN ({spinsLeft} left)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Last Win */}
              {lastWin && (
                <Card className="border-green-500 bg-green-500/10 animate-pulse-slow">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {lastWin.isJackpot ? "JACKPOT!" : "Treasure Found!"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-green-400">${lastWin.amount.toLocaleString()}</div>
                      <div className="text-2xl">{lastWin.combination}</div>
                      {lastWin.isJackpot && (
                        <div className="text-xs text-yellow-400 animate-pulse">🎉 PROGRESSIVE JACKPOT! 🎉</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paytable */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Treasure Map</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(payouts).map(([combo, multiplier]) => (
                    <div key={combo} className="flex justify-between">
                      <span>{combo}</span>
                      <span className="text-yellow-400">{multiplier}x</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-reel {
          0% { transform: translateY(0); }
          50% { transform: translateY(-100px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
