"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, RotateCcw } from "lucide-react"
import Link from "next/link"

const wheelSegments = [
  { label: "100x", color: "#FFD700", multiplier: 100 },
  { label: "2x", color: "#0A1A2F", multiplier: 2 },
  { label: "5x", color: "#FFD700", multiplier: 5 },
  { label: "10x", color: "#0A1A2F", multiplier: 10 },
  { label: "20x", color: "#FFD700", multiplier: 20 },
  { label: "3x", color: "#0A1A2F", multiplier: 3 },
  { label: "50x", color: "#FFD700", multiplier: 50 },
  { label: "4x", color: "#0A1A2F", multiplier: 4 },
]

export default function SpinWheelGame() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(100)
  const [balance, setBalance] = useState(5000)
  const [lastWin, setLastWin] = useState(null)
  const [spinsLeft, setSpinsLeft] = useState(5)
  const wheelRef = useRef(null)

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0 || betAmount > balance) return

    setIsSpinning(true)
    setSpinsLeft((prev) => prev - 1)
    setBalance((prev) => prev - betAmount)

    // Random spin animation
    const randomRotation = Math.random() * 360 + 1440 // At least 4 full rotations
    const segmentAngle = 360 / wheelSegments.length
    const winningSegmentIndex = Math.floor((360 - (randomRotation % 360)) / segmentAngle) % wheelSegments.length
    const winningSegment = wheelSegments[winningSegmentIndex]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    setTimeout(() => {
      const winAmount = betAmount * winningSegment.multiplier
      setBalance((prev) => prev + winAmount)
      setLastWin({ amount: winAmount, multiplier: winningSegment.multiplier })
      setIsSpinning(false)
    }, 3000)
  }

  const adjustBet = (amount) => {
    setBetAmount((prev) => Math.max(10, Math.min(1000, prev + amount)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0A1A2F]/95 to-[#0A1A2F]/90 text-[#F5F5F5] p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <Link href="/casino">
            <Button variant="ghost" size="sm" className="text-[#FFD700] hover:text-[#FFD700]/80 hover:bg-[#FFD700]/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#FFD700]">Spin the Wheel</h1>
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50 text-sm sm:text-base">
            Balance: ${balance}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Wheel */}
          <div className="lg:col-span-2">
            <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 mx-auto">
                  {/* Wheel */}
                  <div
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-4 sm:border-6 lg:border-8 border-[#FFD700] relative transition-transform duration-3000 ease-out"
                    style={{
                      background: `conic-gradient(${wheelSegments
                        .map(
                          (segment, index) =>
                            `${segment.color} ${index * (360 / wheelSegments.length)}deg ${(index + 1) * (360 / wheelSegments.length)}deg`,
                        )
                        .join(", ")})`,
                    }}
                  >
                    {/* Segments with labels */}
                    {wheelSegments.map((segment, index) => {
                      const angle = (360 / wheelSegments.length) * index
                      return (
                        <div
                          key={index}
                          className="absolute w-full h-full flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            transform: `rotate(${angle + (360 / wheelSegments.length) / 2}deg)`,
                            transformOrigin: "center",
                          }}
                        >
                          <span
                            className="absolute"
                            style={{
                              top: "20px",
                              transform: `rotate(-${angle + (360 / wheelSegments.length) / 2}deg)`,
                            }}
                          >
                            {segment.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#FFD700]"></div>
                  </div>

                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[#FFD700] rounded-full border-4 border-white flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 text-[#0A1A2F]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50">
              <CardHeader>
                <CardTitle className="text-[#FFD700] text-base sm:text-lg">Place Your Bet</CardTitle>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
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
                  onClick={handleSpin}
                  disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                >
                  {isSpinning ? "Spinning..." : `SPIN (${spinsLeft} left)`}
                </Button>
              </CardContent>
            </Card>

            {/* Last Win */}
            {lastWin && (
              <Card className="border-2 border-[#FFD700] bg-[#FFD700]/10">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] text-base sm:text-lg">You Won!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-[#FFD700]">${lastWin.amount}</div>
                    <div className="text-xs sm:text-sm text-[#F5F5F5]/70">{lastWin.multiplier}x multiplier</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Info */}
            <Card className="bg-[#0A1A2F]/80 border-2 border-[#FFD700]/50">
              <CardHeader>
                <CardTitle className="text-[#FFD700] text-base sm:text-lg">Game Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-[#F5F5F5]/70 space-y-2">
                <p>• Place your bet and spin the wheel</p>
                <p>• Win based on the multiplier you land on</p>
                <p>• Higher multipliers are rarer</p>
                <p>• You have 5 spins per session</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
