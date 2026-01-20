"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, Play, Trophy, Gem } from "lucide-react"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0A1A2F]/95 to-[#0A1A2F]/90 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#FFD700] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 sm:p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <Link href="/casino">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#FFD700] hover:text-[#FFD700]/80 hover:bg-[#FFD700]/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#FFD700] via-[#FFD700]/90 to-[#FFD700]/80 bg-clip-text text-transparent">
                TREASURES
              </h1>
              <p className="text-xs sm:text-sm text-[#F5F5F5]/70">Hunt for Hidden Riches</p>
            </div>
            <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50 text-sm sm:text-base">
              Balance: ${balance.toLocaleString()}
            </Badge>
          </div>

          <Card className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 border-2 border-[#FFD700]/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-[#FFD700] mb-1">PROGRESSIVE JACKPOT</div>
              <div className="text-2xl sm:text-3xl font-bold text-[#FFD700] animate-pulse">
                ${jackpot.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
            <div className="xl:col-span-3">
              <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50 shadow-2xl shadow-[#FFD700]/20">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="bg-[#0A1A2F]/70 rounded-lg p-4 sm:p-6 border-2 border-[#FFD700]">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                      {reels.map((reel, reelIndex) => (
                        <div key={reelIndex} className="space-y-1 sm:space-y-2">
                          {reel.map((symbol, symbolIndex) => (
                            <div
                              key={symbolIndex}
                              ref={(el) => {
                                if (!reelRefs.current[reelIndex]) reelRefs.current[reelIndex] = el
                              }}
                              className={`h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 mx-auto bg-[#0A1A2F]/90 rounded-lg flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl border-2 ${
                                symbolIndex === 1
                                  ? "border-[#FFD700] shadow-lg shadow-[#FFD700]/50"
                                  : "border-[#F5F5F5]/20"
                              } transition-all duration-300`}
                            >
                              {symbol}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-4 sm:left-8 right-4 sm:right-8 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-50"></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#FFD700] text-base sm:text-lg">
                    <Gem className="h-4 w-4 sm:h-5 sm:w-5" />
                    Bet Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[#F5F5F5]/70">Bet Amount</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(-10)}
                        className="border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-base sm:text-lg w-14 sm:w-16 text-center text-[#FFD700]">
                        ${betAmount}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(10)}
                        className="border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
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
                        className={
                          betAmount === amount
                            ? "bg-[#FFD700] text-[#0A1A2F] text-xs sm:text-sm"
                            : "border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10 text-xs sm:text-sm"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                    onClick={spinReels}
                    disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                  >
                    {isSpinning ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A1A2F] border-t-transparent"></div>
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

              {lastWin && (
                <Card className="border-2 border-[#FFD700] bg-[#FFD700]/10 animate-pulse-slow">
                  <CardHeader>
                    <CardTitle className="text-[#FFD700] flex items-center gap-2 text-base sm:text-lg">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                      {lastWin.isJackpot ? "JACKPOT!" : "Treasure Found!"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-[#FFD700]">
                        ${lastWin.amount.toLocaleString()}
                      </div>
                      <div className="text-xl sm:text-2xl">{lastWin.combination}</div>
                      {lastWin.isJackpot && (
                        <div className="text-xs text-[#FFD700] animate-pulse">🎉 PROGRESSIVE JACKPOT! 🎉</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] text-base sm:text-lg">Treasure Map</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                  {Object.entries(payouts).map(([combo, multiplier]) => (
                    <div key={combo} className="flex justify-between text-[#F5F5F5]">
                      <span>{combo}</span>
                      <span className="text-[#FFD700]">{multiplier}x</span>
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
