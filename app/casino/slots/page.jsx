"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, Zap } from "lucide-react"
import Link from "next/link"

const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣", "🔔"]
const reelCount = 3
const symbolsPerReel = 5

export default function SlotsGame() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(50)
  const [balance, setBalance] = useState(5000)
  const [lastWin, setLastWin] = useState(null)
  const [jackpot, setJackpot] = useState(777777)
  const [reels, setReels] = useState([
    Array(symbolsPerReel)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
    Array(symbolsPerReel)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
    Array(symbolsPerReel)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
  ])
  const reelRefs = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot((prev) => prev + Math.floor(Math.random() * 10) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const getWinAmount = (result) => {
    const centerLine = result.map((reel) => reel[2])

    if (centerLine[0] === centerLine[1] && centerLine[1] === centerLine[2]) {
      const symbol = centerLine[0]
      const multipliers = {
        "💎": 100,
        "7️⃣": 50,
        "⭐": 25,
        "🔔": 20,
        "🍇": 15,
        "🍊": 10,
        "🍋": 8,
        "🍒": 5,
      }
      return betAmount * (multipliers[symbol] || 2)
    }

    if (centerLine[0] === centerLine[1] || centerLine[1] === centerLine[2] || centerLine[0] === centerLine[2]) {
      return betAmount * 2
    }

    return 0
  }

  const handleSpin = () => {
    if (isSpinning || betAmount > balance) return

    setIsSpinning(true)
    setBalance((prev) => prev - betAmount)
    setLastWin(null)

    const newReels = Array(reelCount)
      .fill()
      .map(() =>
        Array(symbolsPerReel)
          .fill()
          .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
      )

    reelRefs.current.forEach((reel, index) => {
      if (reel) {
        reel.style.animation = `spin 2s ease-out ${index * 0.2}s`
      }
    })

    setTimeout(() => {
      setReels(newReels)
      const winAmount = getWinAmount(newReels)

      if (winAmount > 0) {
        setBalance((prev) => prev + winAmount)
        setLastWin(winAmount)
      }

      setIsSpinning(false)

      reelRefs.current.forEach((reel) => {
        if (reel) reel.style.animation = ""
      })
    }, 2500)
  }

  const adjustBet = (amount) => {
    setBetAmount((prev) => Math.max(10, Math.min(500, prev + amount)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0A1A2F]/95 to-[#0A1A2F]/90 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
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
        <div className="absolute inset-0 bg-gradient-radial from-[#FFD700]/5 via-transparent to-transparent animate-pulse"></div>
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#FFD700] via-[#FFD700]/90 to-[#FFD700]/80 bg-clip-text text-transparent">
              MEGA SLOTS
            </h1>
            <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 text-[#0A1A2F] font-bold text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              Balance: ${balance.toLocaleString()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-[#0A1A2F]/80 backdrop-blur-sm border-2 border-[#FFD700]/50 shadow-2xl shadow-[#FFD700]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 via-transparent to-[#FFD700]/5"></div>
                <CardContent className="p-4 sm:p-6 lg:p-8 relative z-10">
                  <div className="bg-gradient-to-b from-[#0A1A2F]/60 to-[#0A1A2F]/80 rounded-2xl p-4 sm:p-6 lg:p-8 border-4 border-[#FFD700]/70 shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 via-transparent to-[#FFD700]/10 animate-pulse rounded-2xl"></div>

                    <div className="text-center mb-6 sm:mb-8 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 blur-xl rounded-full"></div>
                      <div className="relative bg-gradient-to-r from-[#FFD700] to-[#FFD700]/90 text-[#0A1A2F] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full border-4 border-[#FFD700] shadow-lg">
                        <div className="text-sm sm:text-base lg:text-lg font-bold mb-1">JACKPOT</div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black animate-pulse">
                          ${jackpot.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-2 sm:space-x-3 lg:space-x-4 mb-6 sm:mb-8">
                      {reels.map((reel, reelIndex) => (
                        <div key={reelIndex} className="relative">
                          <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 rounded-xl blur opacity-75 animate-pulse"></div>
                          <div className="relative bg-gradient-to-b from-[#0A1A2F]/90 to-[#0A1A2F] rounded-xl p-2 sm:p-3 border-2 border-[#FFD700]/70 shadow-xl">
                            <div
                              ref={(el) => (reelRefs.current[reelIndex] = el)}
                              className="flex flex-col space-y-1 sm:space-y-2"
                            >
                              {reel.map((symbol, symbolIndex) => (
                                <div
                                  key={symbolIndex}
                                  className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl rounded-lg border-2 transition-all duration-300 ${
                                    symbolIndex === 2
                                      ? "border-[#FFD700] bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/20 shadow-lg shadow-[#FFD700]/50 scale-110"
                                      : "border-[#F5F5F5]/20 bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/90"
                                  }`}
                                >
                                  {symbol}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4 bg-gradient-to-r from-[#FFD700] to-[#FFD700]/90 px-4 sm:px-6 py-2 rounded-full border-2 border-[#FFD700]">
                        <div className="w-6 sm:w-8 h-1 bg-[#0A1A2F] rounded-full animate-pulse"></div>
                        <span className="text-[#0A1A2F] font-bold text-sm sm:text-base lg:text-lg">WIN LINE</span>
                        <div className="w-6 sm:w-8 h-1 bg-[#0A1A2F] rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-[#0A1A2F]/80 backdrop-blur-sm border-2 border-[#FFD700]/50 shadow-xl shadow-[#FFD700]/10">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] text-lg sm:text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                    Place Your Bet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5F5F5]/80 font-medium text-sm sm:text-base">Bet Amount</span>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(-10)}
                        className="border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="font-bold text-xl sm:text-2xl w-16 sm:w-20 text-center text-[#FFD700]">
                        ${betAmount}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(10)}
                        className="border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[10, 25, 50, 100, 250, 500].map((amount) => (
                      <Button
                        key={amount}
                        size="sm"
                        variant={betAmount === amount ? "default" : "outline"}
                        onClick={() => setBetAmount(amount)}
                        className={
                          betAmount === amount
                            ? "bg-gradient-to-r from-[#FFD700] to-[#FFD700]/90 text-[#0A1A2F] font-bold text-xs sm:text-sm"
                            : "border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/10 text-xs sm:text-sm"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFD700]/90 hover:from-[#FFD700]/90 hover:to-[#FFD700]/80 text-[#0A1A2F] shadow-lg hover:shadow-[#FFD700]/25 transition-all duration-300 relative overflow-hidden"
                    onClick={handleSpin}
                    disabled={isSpinning || betAmount > balance}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    <Zap className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    {isSpinning ? "SPINNING..." : "SPIN TO WIN"}
                  </Button>
                </CardContent>
              </Card>

              {lastWin && (
                <Card className="border-2 border-[#FFD700] bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/10 shadow-xl shadow-[#FFD700]/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-transparent animate-pulse"></div>
                  <CardHeader>
                    <CardTitle className="text-[#FFD700] text-xl sm:text-2xl text-center animate-bounce">
                      🎉 BIG WIN! 🎉
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center relative">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FFD700] animate-pulse mb-2">
                        ${lastWin.toLocaleString()}
                      </div>
                      <div className="text-base sm:text-lg text-[#FFD700]/90 font-medium">Congratulations!</div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/20 to-transparent blur-xl animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-[#0A1A2F]/80 backdrop-blur-sm border-2 border-[#FFD700]/50">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">💰</span>
                    Paytable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {[
                    { symbols: "💎💎💎", multiplier: "100x", color: "text-[#FFD700]" },
                    { symbols: "7️⃣7️⃣7️⃣", multiplier: "50x", color: "text-[#FFD700]/90" },
                    { symbols: "⭐⭐⭐", multiplier: "25x", color: "text-[#FFD700]/80" },
                    { symbols: "🔔🔔🔔", multiplier: "20x", color: "text-[#FFD700]/70" },
                    { symbols: "🍇🍇🍇", multiplier: "15x", color: "text-[#FFD700]/60" },
                    { symbols: "🍊🍊🍊", multiplier: "10x", color: "text-[#FFD700]/50" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-[#F5F5F5]/5 to-transparent rounded-lg border border-[#F5F5F5]/10"
                    >
                      <span className="text-lg sm:text-2xl">{item.symbols}</span>
                      <span className={`font-bold text-base sm:text-lg ${item.color}`}>{item.multiplier}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(0); }
          25% { transform: translateY(-50px) rotateX(90deg); }
          50% { transform: translateY(-100px) rotateX(180deg); }
          75% { transform: translateY(-50px) rotateX(270deg); }
          100% { transform: translateY(0) rotateX(360deg); }
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}
