"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, RotateCcw, Trophy, Zap } from "lucide-react"
import Link from "next/link"

const wheelSegments = [
  { label: "JACKPOT", color: "#FFD700", multiplier: 1000, glow: true },
  { label: "2x", color: "#0A1A2F", multiplier: 2 },
  { label: "5x", color: "#FFD700", multiplier: 5 },
  { label: "10x", color: "#0A1A2F", multiplier: 10 },
  { label: "MEGA", color: "#FFD700", multiplier: 500, glow: true },
  { label: "3x", color: "#0A1A2F", multiplier: 3 },
  { label: "50x", color: "#FFD700", multiplier: 50 },
  { label: "LOSE", color: "#666666", multiplier: 0 },
  { label: "20x", color: "#FFD700", multiplier: 20 },
  { label: "4x", color: "#0A1A2F", multiplier: 4 },
  { label: "100x", color: "#FFD700", multiplier: 100, glow: true },
  { label: "7x", color: "#0A1A2F", multiplier: 7 },
]

export default function SpinItRichGame() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(100)
  const [balance, setBalance] = useState(25000)
  const [lastWin, setLastWin] = useState(null)
  const [spinsLeft, setSpinsLeft] = useState(10)
  const [totalWins, setTotalWins] = useState(0)
  const [streak, setStreak] = useState(0)
  const wheelRef = useRef(null)
  const [rotation, setRotation] = useState(0)

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0 || betAmount > balance) return

    setIsSpinning(true)
    setSpinsLeft((prev) => prev - 1)
    setBalance((prev) => prev - betAmount)

    const randomRotation = Math.random() * 360 + 3600 + rotation
    const segmentAngle = 360 / wheelSegments.length
    const finalAngle = randomRotation % 360
    const winningSegmentIndex = Math.floor((360 - finalAngle) / segmentAngle) % wheelSegments.length
    const winningSegment = wheelSegments[winningSegmentIndex]

    setRotation(randomRotation)

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    setTimeout(() => {
      const winAmount = betAmount * winningSegment.multiplier
      setBalance((prev) => prev + winAmount)
      setTotalWins((prev) => prev + winAmount)

      if (winAmount > 0) {
        setStreak((prev) => prev + 1)
        setLastWin({
          amount: winAmount,
          multiplier: winningSegment.multiplier,
          segment: winningSegment.label,
          isJackpot: winningSegment.glow,
        })
      } else {
        setStreak(0)
        setLastWin({ amount: 0, multiplier: 0, segment: "LOSE" })
      }

      setIsSpinning(false)
    }, 4000)
  }

  const adjustBet = (amount) => {
    setBetAmount((prev) => Math.max(10, Math.min(5000, prev + amount)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] relative overflow-hidden">
      <div className="relative z-10 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <Link href="/casino">
              <Button variant="ghost" size="sm" className="hover:bg-[#FFD700]/20 text-[#F5F5F5]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Casino
              </Button>
            </Link>
            <div className="text-center w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FFD700] via-[#FFD700]/80 to-[#FFD700] bg-clip-text text-transparent">
                SPIN IT RICH!
              </h1>
              <p className="text-xs sm:text-sm text-[#B8C5D6]">The Ultimate Wheel of Fortune</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                <Trophy className="mr-1 h-3 w-3" />
                Streak: {streak}
              </Badge>
              <Badge variant="secondary" className="bg-[#FFD700]/20 text-[#FFD700] text-xs">
                Balance: ${balance.toLocaleString()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Wheel */}
            <div className="lg:col-span-3">
              <Card className="bg-[#0D1F35]/80 border-[#FFD700]/30 shadow-2xl shadow-[#FFD700]/20">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto aspect-square">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFD700]/50 to-[#FFD700] animate-spin-slow opacity-30 blur-xl"></div>

                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="relative w-full h-full rounded-full border-4 sm:border-8 border-[#FFD700] shadow-2xl shadow-[#FFD700]/50 transition-transform duration-4000 ease-out"
                      style={{
                        background: `conic-gradient(${wheelSegments
                          .map(
                            (segment, index) =>
                              `${segment.color} ${index * (360 / wheelSegments.length)}deg ${(index + 1) * (360 / wheelSegments.length)}deg`,
                          )
                          .join(", ")})`,
                        filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))",
                      }}
                    >
                      {/* Segments with labels */}
                      {wheelSegments.map((segment, index) => {
                        const angle = (360 / wheelSegments.length) * index
                        return (
                          <div
                            key={index}
                            className="absolute w-full h-full flex items-center justify-center"
                            style={{
                              transform: `rotate(${angle + (360 / wheelSegments.length) / 2}deg)`,
                              transformOrigin: "center",
                            }}
                          >
                            <span
                              className={`absolute font-bold text-xs sm:text-sm md:text-lg ${segment.glow ? "text-[#0A1A2F] animate-pulse" : segment.color === "#FFD700" ? "text-[#0A1A2F]" : "text-[#FFD700]"}`}
                              style={{
                                top: "15%",
                                transform: `rotate(-${angle + (360 / wheelSegments.length) / 2}deg)`,
                                textShadow: segment.glow ? "0 0 10px currentColor" : "none",
                              }}
                            >
                              {segment.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 sm:-translate-y-4">
                      <div className="relative">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 sm:border-l-6 sm:border-r-6 sm:border-b-12 border-l-transparent border-r-transparent border-b-[#FFD700] drop-shadow-lg"></div>
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#FFD700] rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#FFD700] to-[#FFD700]/80 rounded-full border-2 sm:border-4 border-white flex items-center justify-center shadow-2xl">
                      <RotateCcw
                        className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#0A1A2F] ${isSpinning ? "animate-spin" : ""}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="space-y-4 sm:space-y-6">
              {/* Betting */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55] hover:border-[#FFD700]/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFD700]" />
                    Place Your Bet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[#B8C5D6]">Bet Amount</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(-50)}
                        className="hover:bg-red-500/20 h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="font-bold text-lg sm:text-xl w-16 sm:w-20 text-center text-[#FFD700]">
                        ${betAmount}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(50)}
                        className="hover:bg-green-500/20 h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[50, 100, 500, 1000].map((amount) => (
                      <Button
                        key={amount}
                        size="sm"
                        variant={betAmount === amount ? "default" : "outline"}
                        onClick={() => setBetAmount(amount)}
                        className={
                          betAmount === amount
                            ? "bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 text-[#0A1A2F]"
                            : "text-[#F5F5F5]"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-12 sm:h-14 text-base sm:text-xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFD700]/80 hover:from-[#FFD700]/90 hover:to-[#FFD700]/70 text-[#0A1A2F] shadow-lg shadow-[#FFD700]/30 transition-all duration-300 hover:scale-105"
                    onClick={handleSpin}
                    disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                  >
                    {isSpinning ? (
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        SPINNING...
                      </div>
                    ) : (
                      `SPIN NOW! (${spinsLeft} left)`
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Last Win */}
              {lastWin && (
                <Card
                  className={`${lastWin.amount > 0 ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`${lastWin.amount > 0 ? "text-green-400" : "text-red-400"} flex items-center gap-2 text-base sm:text-lg`}
                    >
                      {lastWin.amount > 0 ? (
                        <>
                          <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                          {lastWin.isJackpot ? "JACKPOT!" : "You Won!"}
                        </>
                      ) : (
                        "Try Again!"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div
                        className={`text-2xl sm:text-3xl md:text-4xl font-bold ${lastWin.amount > 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {lastWin.amount > 0 ? `$${lastWin.amount.toLocaleString()}` : "$0"}
                      </div>
                      <div className="text-xs sm:text-sm text-[#B8C5D6]">
                        {lastWin.segment} {lastWin.multiplier > 0 && `(${lastWin.multiplier}x)`}
                      </div>
                      {lastWin.isJackpot && <div className="text-xs text-[#FFD700] animate-pulse">🎉 MEGA WIN! 🎉</div>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Session Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B8C5D6]">Total Wins:</span>
                    <span className="font-bold text-green-400">${totalWins.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B8C5D6]">Win Streak:</span>
                    <span className="font-bold text-[#FFD700]">{streak}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B8C5D6]">Spins Left:</span>
                    <span className="font-bold text-blue-400">{spinsLeft}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
