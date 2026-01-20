"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, RotateCcw, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { FloatingElements } from "@/components/ui/floating-elements"
import { LightningParticles } from "@/components/ui/lightning-particles"

const wheelSegments = [
  { label: "JACKPOT", color: "#ff0066", multiplier: 1000, glow: true },
  { label: "2x", color: "#00ff88", multiplier: 2 },
  { label: "5x", color: "#0088ff", multiplier: 5 },
  { label: "10x", color: "#ff8800", multiplier: 10 },
  { label: "MEGA", color: "#8800ff", multiplier: 500, glow: true },
  { label: "3x", color: "#ff0088", multiplier: 3 },
  { label: "50x", color: "#00ffff", multiplier: 50 },
  { label: "LOSE", color: "#666666", multiplier: 0 },
  { label: "20x", color: "#ffff00", multiplier: 20 },
  { label: "4x", color: "#ff4400", multiplier: 4 },
  { label: "100x", color: "#44ff00", multiplier: 100, glow: true },
  { label: "7x", color: "#ff0044", multiplier: 7 },
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

    // Enhanced spin animation with multiple rotations
    const randomRotation = Math.random() * 360 + 3600 + rotation // At least 10 full rotations
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
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-slate-800 relative overflow-hidden">
      <FloatingElements />
      <LightningParticles />

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard/games">
              <Button variant="ghost" size="sm" className="hover:bg-yellow-500/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
                SPIN IT RICH!
              </h1>
              <p className="text-sm text-muted-foreground">The Ultimate Wheel of Fortune</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                <Trophy className="mr-1 h-3 w-3" />
                Streak: {streak}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                Balance: ${balance.toLocaleString()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Enhanced Wheel */}
            <div className="xl:col-span-3">
              <Card className="bg-slate-800/50 border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
                <CardContent className="p-8">
                  <div className="relative w-96 h-96 mx-auto">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-spin-slow opacity-30 blur-xl"></div>

                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="relative w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl shadow-yellow-500/50 transition-transform duration-4000 ease-out"
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
                      {/* Segments with enhanced labels */}
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
                              className={`absolute font-bold text-lg ${segment.glow ? "text-white animate-pulse text-shadow-glow" : "text-white"}`}
                              style={{
                                top: "30px",
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

                    {/* Enhanced Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                      <div className="relative">
                        <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Enhanced Center circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white flex items-center justify-center shadow-2xl">
                      <RotateCcw className={`h-8 w-8 text-white ${isSpinning ? "animate-spin" : ""}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Controls */}
            <div className="space-y-6">
              {/* Betting */}
              <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Place Your Bet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bet Amount</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(-50)}
                        className="hover:bg-red-500/20"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-xl w-20 text-center text-yellow-400">${betAmount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustBet(50)}
                        className="hover:bg-green-500/20"
                      >
                        <Plus className="h-4 w-4" />
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
                        className={betAmount === amount ? "bg-gradient-to-r from-yellow-500 to-orange-500" : ""}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-105"
                    onClick={handleSpin}
                    disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                  >
                    {isSpinning ? (
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-6 w-6 animate-spin" />
                        SPINNING...
                      </div>
                    ) : (
                      `SPIN NOW! (${spinsLeft} left)`
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Last Win */}
              {lastWin && (
                <Card
                  className={`${lastWin.amount > 0 ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"} animate-pulse-slow`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`${lastWin.amount > 0 ? "text-green-400" : "text-red-400"} flex items-center gap-2`}
                    >
                      {lastWin.amount > 0 ? (
                        <>
                          <Trophy className="h-5 w-5" />
                          {lastWin.isJackpot ? "JACKPOT!" : "You Won!"}
                        </>
                      ) : (
                        "Try Again!"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className={`text-4xl font-bold ${lastWin.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {lastWin.amount > 0 ? `$${lastWin.amount.toLocaleString()}` : "$0"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lastWin.segment} {lastWin.multiplier > 0 && `(${lastWin.multiplier}x)`}
                      </div>
                      {lastWin.isJackpot && (
                        <div className="text-xs text-yellow-400 animate-pulse">🎉 MEGA WIN! 🎉</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Session Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Wins:</span>
                    <span className="font-bold text-green-400">${totalWins.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Win Streak:</span>
                    <span className="font-bold text-yellow-400">{streak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Spins Left:</span>
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
