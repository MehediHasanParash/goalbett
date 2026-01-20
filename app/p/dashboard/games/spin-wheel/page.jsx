"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, RotateCcw } from "lucide-react"
import Link from "next/link"

const wheelSegments = [
  { label: "100x", color: "#ff6b6b", multiplier: 100 },
  { label: "2x", color: "#4ecdc4", multiplier: 2 },
  { label: "5x", color: "#45b7d1", multiplier: 5 },
  { label: "10x", color: "#96ceb4", multiplier: 10 },
  { label: "20x", color: "#feca57", multiplier: 20 },
  { label: "3x", color: "#ff9ff3", multiplier: 3 },
  { label: "50x", color: "#54a0ff", multiplier: 50 },
  { label: "4x", color: "#5f27cd", multiplier: 4 },
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Spin the Wheel</h1>
          <Badge variant="secondary">Balance: ${balance}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <div className="relative w-80 h-80 mx-auto">
                  {/* Wheel */}
                  <div
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-8 border-gold relative transition-transform duration-3000 ease-out"
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
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gold"></div>
                  </div>

                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gold rounded-full border-4 border-white flex items-center justify-center">
                    <RotateCcw className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Betting */}
            <Card>
              <CardHeader>
                <CardTitle>Place Your Bet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bet Amount</span>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => adjustBet(-10)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg w-16 text-center">${betAmount}</span>
                    <Button size="sm" variant="outline" onClick={() => adjustBet(10)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      variant={betAmount === amount ? "default" : "outline"}
                      onClick={() => setBetAmount(amount)}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                <Button
                  className="w-full h-12 text-lg font-bold"
                  onClick={handleSpin}
                  disabled={isSpinning || spinsLeft <= 0 || betAmount > balance}
                >
                  {isSpinning ? "Spinning..." : `SPIN (${spinsLeft} left)`}
                </Button>
              </CardContent>
            </Card>

            {/* Last Win */}
            {lastWin && (
              <Card className="border-green-500 bg-green-500/10">
                <CardHeader>
                  <CardTitle className="text-green-500">You Won!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">${lastWin.amount}</div>
                    <div className="text-sm text-muted-foreground">{lastWin.multiplier}x multiplier</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle>Game Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
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
