"use client"
import { useState, useRef } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Minus, Plus } from "lucide-react"

export function SlotMachine() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(1500)
  const [spinsLeft, setSpinsLeft] = useState(5)
  const [result, setResult] = useState(null)
  const [reels, setReels] = useState([
    ["7", "7", "7"],
    ["7", "7", "7"],
    ["7", "7", "7"],
  ])

  const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7", "🔔"]
  const reelRefs = [useRef(null), useRef(null), useRef(null)]

  const handleSpin = () => {
    if (isSpinning || spinsLeft === 0) return

    setIsSpinning(true)
    setResult(null)

    // Animate each reel
    reelRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.style.transform = `translateY(-${Math.random() * 2000 + 1000}px)`
      }
    })

    setTimeout(() => {
      // Generate random results
      const newReels = reels.map(() => [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ])

      setReels(newReels)
      setIsSpinning(false)
      setSpinsLeft(spinsLeft - 1)

      // Check for wins
      const middleRow = newReels.map((reel) => reel[1])
      const isWin = middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]
      const winMultiplier = isWin ? (middleRow[0] === "7" ? 100 : middleRow[0] === "💎" ? 50 : 10) : 0

      setResult({
        isWin,
        winAmount: betAmount * winMultiplier,
        symbols: middleRow,
      })

      // Reset reel positions
      reelRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.style.transform = "translateY(0)"
        }
      })
    }, 2000)
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
          <h1 className="text-xl font-bold">Slot Machine</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
              4056
            </div>
            <button className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slot Machine */}
        <div className="glass p-8 rounded-2xl mb-6">
          <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-6 rounded-2xl mb-6">
            <div className="text-center mb-4">
              <div className="text-black font-bold text-lg bg-yellow-300 px-4 py-2 rounded-lg inline-block">
                JACKPOT
              </div>
            </div>

            {/* Reels */}
            <div className="flex gap-2 mb-4">
              {reels.map((reel, reelIndex) => (
                <div key={reelIndex} className="flex-1 bg-white rounded-lg overflow-hidden h-32 relative">
                  <div
                    ref={reelRefs[reelIndex]}
                    className="transition-transform duration-2000 ease-out"
                    style={{ transform: "translateY(0)" }}
                  >
                    {reel.map((symbol, symbolIndex) => (
                      <div
                        key={symbolIndex}
                        className="h-32 flex items-center justify-center text-4xl font-bold border-b border-gray-200 last:border-b-0"
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                  {/* Highlight middle row */}
                  <div className="absolute top-1/2 left-0 right-0 h-32 transform -translate-y-1/2 border-2 border-red-500 pointer-events-none"></div>
                </div>
              ))}
            </div>

            {/* Payline indicator */}
            <div className="flex items-center justify-center gap-2 text-black">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span className="text-sm font-bold">PAYLINE</span>
              <div className="w-4 h-0.5 bg-red-500"></div>
            </div>
          </div>

          {/* Weekend Special Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl mb-4 text-center">
            <div className="text-white font-bold">WEEKEND SPECIAL</div>
            <div className="text-white text-sm">Earn Double Coins!</div>
            <div className="text-yellow-300 text-xs">Expires in 24 hrs</div>
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
            <h3 className="text-xl font-bold mb-2">{result.isWin ? "JACKPOT!" : "Try Again!"}</h3>
            <div className="flex justify-center gap-2 mb-4 text-2xl">
              {result.symbols.map((symbol, index) => (
                <span key={index}>{symbol}</span>
              ))}
            </div>
            {result.isWin && (
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
