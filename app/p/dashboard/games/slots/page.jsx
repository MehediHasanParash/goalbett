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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-500/5 via-transparent to-transparent animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/games">
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              MEGA SLOTS
            </h1>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold text-lg px-4 py-2">
              Balance: ${balance.toLocaleString()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="bg-gradient-to-b from-yellow-900/40 to-yellow-800/60 rounded-2xl p-8 border-4 border-yellow-500/70 shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10 animate-pulse rounded-2xl"></div>

                    <div className="text-center mb-8 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl rounded-full"></div>
                      <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 text-black px-8 py-4 rounded-full border-4 border-yellow-400 shadow-lg">
                        <div className="text-lg font-bold mb-1">JACKPOT</div>
                        <div className="text-4xl font-black animate-pulse">${jackpot.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-4 mb-8">
                      {reels.map((reel, reelIndex) => (
                        <div key={reelIndex} className="relative">
                          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 animate-pulse"></div>
                          <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-3 border-2 border-yellow-500/70 shadow-xl">
                            <div ref={(el) => (reelRefs.current[reelIndex] = el)} className="flex flex-col space-y-2">
                              {reel.map((symbol, symbolIndex) => (
                                <div
                                  key={symbolIndex}
                                  className={`w-20 h-20 flex items-center justify-center text-4xl rounded-lg border-2 transition-all duration-300 ${
                                    symbolIndex === 2
                                      ? "border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 shadow-lg shadow-yellow-400/50 scale-110"
                                      : "border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800"
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

                    <div className="flex justify-center mb-6">
                      <div className="flex items-center space-x-4 bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-2 rounded-full border-2 border-yellow-400">
                        <div className="w-8 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                        <span className="text-black font-bold text-lg">WIN LINE</span>
                        <div className="w-8 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/10">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-xl flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    Place Your Bet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">Bet Amount</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(-10)}
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-2xl w-20 text-center text-yellow-400">${betAmount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(10)}
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[10, 25, 50, 100, 250, 500].map((amount) => (
                      <Button
                        key={amount}
                        size="sm"
                        variant={betAmount === amount ? "default" : "outline"}
                        onClick={() => setBetAmount(amount)}
                        className={
                          betAmount === amount
                            ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold"
                            : "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 relative overflow-hidden"
                    onClick={handleSpin}
                    disabled={isSpinning || betAmount > balance}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    <Zap className="mr-3 h-6 w-6" />
                    {isSpinning ? "SPINNING..." : "SPIN TO WIN"}
                  </Button>
                </CardContent>
              </Card>

              {lastWin && (
                <Card className="border-2 border-green-400 bg-gradient-to-br from-green-500/20 to-emerald-600/20 shadow-xl shadow-green-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-500/10 animate-pulse"></div>
                  <CardHeader>
                    <CardTitle className="text-green-400 text-2xl text-center animate-bounce">🎉 BIG WIN! 🎉</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center relative">
                      <div className="text-5xl font-black text-green-400 animate-pulse mb-2">
                        ${lastWin.toLocaleString()}
                      </div>
                      <div className="text-lg text-green-300 font-medium">Congratulations!</div>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent blur-xl animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Paytable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { symbols: "💎💎💎", multiplier: "100x", color: "text-purple-400" },
                    { symbols: "7️⃣7️⃣7️⃣", multiplier: "50x", color: "text-red-400" },
                    { symbols: "⭐⭐⭐", multiplier: "25x", color: "text-yellow-400" },
                    { symbols: "🔔🔔🔔", multiplier: "20x", color: "text-blue-400" },
                    { symbols: "🍇🍇🍇", multiplier: "15x", color: "text-purple-300" },
                    { symbols: "🍊🍊🍊", multiplier: "10x", color: "text-orange-400" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-lg border border-white/10"
                    >
                      <span className="text-2xl">{item.symbols}</span>
                      <span className={`font-bold text-lg ${item.color}`}>{item.multiplier}</span>
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
