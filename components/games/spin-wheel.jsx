"use client"
import { useState, useRef } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Minus, Plus } from "lucide-react"

export function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(2000)
  const [spinsLeft, setSpinsLeft] = useState(2)
  const [result, setResult] = useState(null)
  const wheelRef = useRef(null)

  const segments = [
    { label: "Lose", multiplier: 0, color: "bg-red-500" },
    { label: "50x", multiplier: 50, color: "bg-yellow-500" },
    { label: "20x", multiplier: 20, color: "bg-green-500" },
    { label: "4x", multiplier: 4, color: "bg-blue-500" },
    { label: "3x", multiplier: 3, color: "bg-purple-500" },
    { label: "2x", multiplier: 2, color: "bg-pink-500" },
    { label: "Lose", multiplier: 0, color: "bg-red-500" },
    { label: "10x", multiplier: 10, color: "bg-orange-500" },
  ]

  const handleSpin = () => {
    if (isSpinning || spinsLeft === 0) return

    setIsSpinning(true)
    setResult(null)

    // Random rotation between 1800-3600 degrees (5-10 full rotations)
    const randomRotation = Math.random() * 1800 + 1800
    const finalRotation = randomRotation % 360
    const segmentAngle = 360 / segments.length
    const winningSegmentIndex = Math.floor((360 - finalRotation) / segmentAngle) % segments.length
    const winningSegment = segments[winningSegmentIndex]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    setTimeout(() => {
      setIsSpinning(false)
      setSpinsLeft(spinsLeft - 1)
      setResult({
        segment: winningSegment,
        winAmount: betAmount * winningSegment.multiplier,
      })
    }, 3000)
  }

  const adjustBetAmount = (change) => {
    const newAmount = betAmount + change
    if (newAmount >= 100 && newAmount <= 10000) {
      setBetAmount(newAmount)
    }
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
          <h1 className="text-xl font-bold">Spin the Wheel</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
              4056
            </div>
            <button className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative mb-8">
          <div className="relative w-80 h-80 mx-auto">
            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-8 border-yellow-400 relative transition-transform duration-3000 ease-out"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  #ef4444 0deg 45deg,
                  #eab308 45deg 90deg,
                  #22c55e 90deg 135deg,
                  #3b82f6 135deg 180deg,
                  #a855f7 180deg 225deg,
                  #ec4899 225deg 270deg,
                  #ef4444 270deg 315deg,
                  #f97316 315deg 360deg
                )`,
              }}
            >
              {/* Wheel Segments with Labels */}
              {segments.map((segment, index) => {
                const angle = (360 / segments.length) * index
                return (
                  <div
                    key={index}
                    className="absolute w-full h-full flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      transform: `rotate(${angle + 22.5}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    <div
                      className="absolute"
                      style={{
                        top: "20px",
                        transform: `rotate(${-angle - 22.5}deg)`,
                      }}
                    >
                      {segment.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
            </div>

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center z-10">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Betting Amount */}
        <div className="glass p-6 rounded-2xl mb-6">
          <div className="text-center mb-4">
            <p className="text-muted-foreground mb-2">Betting Amount</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => adjustBetAmount(-500)}
                className="w-10 h-10 bg-card/50 rounded-full flex items-center justify-center hover:bg-card transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-2xl font-bold text-yellow-400">{betAmount}</div>
              <button
                onClick={() => adjustBetAmount(500)}
                className="w-10 h-10 bg-card/50 rounded-full flex items-center justify-center hover:bg-card transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm">You have {spinsLeft} spins left today</p>
        </div>

        {/* Result Display */}
        {result && (
          <div className="glass p-6 rounded-2xl mb-6 text-center animate-scale-in">
            <h3 className="text-xl font-bold mb-2">
              {result.winAmount > 0 ? "Congratulations!" : "Better luck next time!"}
            </h3>
            <p className="text-muted-foreground mb-4">
              You landed on <span className="text-primary font-bold">{result.segment.label}</span>
            </p>
            {result.winAmount > 0 && (
              <div className="text-3xl font-bold text-green-400">${result.winAmount.toLocaleString()}</div>
            )}
          </div>
        )}

        {/* Spin Button */}
        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSpin}
          disabled={isSpinning || spinsLeft === 0}
        >
          {isSpinning ? "Spinning..." : spinsLeft === 0 ? "No Spins Left" : "Spin"}
        </AnimatedButton>
      </div>
    </div>
  )
}
