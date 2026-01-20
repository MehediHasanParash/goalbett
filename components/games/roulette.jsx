"use client"
import { useState, useRef } from "react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Plus } from "react-feather" // Import Plus component

export function Roulette() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedBets, setSelectedBets] = useState([])
  const [betAmount, setBetAmount] = useState(100)
  const [spinsLeft, setSpinsLeft] = useState(8)
  const [result, setResult] = useState(null)
  const wheelRef = useRef(null)

  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26,
  ]

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]

  const getNumberColor = (num) => {
    if (num === 0) return "green"
    return redNumbers.includes(num) ? "red" : "black"
  }

  const betOptions = [
    { label: "10", value: 10, type: "chip" },
    { label: "50", value: 50, type: "chip" },
    { label: "100", value: 100, type: "chip" },
    { label: "500", value: 500, type: "chip" },
    { label: "1000", value: 1000, type: "chip" },
  ]

  const handleSpin = () => {
    if (isSpinning || selectedBets.length === 0) return

    setIsSpinning(true)
    setResult(null)

    const randomRotation = Math.random() * 3600 + 1800
    const winningNumber = numbers[Math.floor(Math.random() * numbers.length)]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    setTimeout(() => {
      setIsSpinning(false)
      setSpinsLeft(spinsLeft - 1)

      // Calculate winnings
      let totalWin = 0
      selectedBets.forEach((bet) => {
        if (bet.type === "number" && bet.value === winningNumber) {
          totalWin += bet.amount * 35 // 35:1 payout for single number
        } else if (bet.type === "color") {
          if (
            (bet.value === "red" && redNumbers.includes(winningNumber)) ||
            (bet.value === "black" && blackNumbers.includes(winningNumber))
          ) {
            totalWin += bet.amount * 2 // 1:1 payout for color
          }
        }
      })

      setResult({
        winningNumber,
        winningColor: getNumberColor(winningNumber),
        totalWin,
      })
    }, 3000)
  }

  const placeBet = (type, value, amount) => {
    setSelectedBets([...selectedBets, { type, value, amount }])
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
          <h1 className="text-xl font-bold">Roulette</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
              4056
            </div>
            <button className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roulette Wheel */}
        <div className="relative mb-8">
          <div className="relative w-80 h-80 mx-auto">
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-8 border-yellow-400 relative transition-transform duration-3000 ease-out"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  #22c55e 0deg 10deg,
                  #ef4444 10deg 20deg,
                  #000000 20deg 30deg,
                  #ef4444 30deg 40deg,
                  #000000 40deg 50deg,
                  #ef4444 50deg 60deg,
                  #000000 60deg 70deg,
                  #ef4444 70deg 80deg,
                  #000000 80deg 90deg,
                  #ef4444 90deg 100deg,
                  #000000 100deg 110deg,
                  #ef4444 110deg 120deg,
                  #000000 120deg 130deg,
                  #ef4444 130deg 140deg,
                  #000000 140deg 150deg,
                  #ef4444 150deg 160deg,
                  #000000 160deg 170deg,
                  #ef4444 170deg 180deg,
                  #000000 180deg 190deg,
                  #ef4444 190deg 200deg,
                  #000000 200deg 210deg,
                  #ef4444 210deg 220deg,
                  #000000 220deg 230deg,
                  #ef4444 230deg 240deg,
                  #000000 240deg 250deg,
                  #ef4444 250deg 260deg,
                  #000000 260deg 270deg,
                  #ef4444 270deg 280deg,
                  #000000 280deg 290deg,
                  #ef4444 290deg 300deg,
                  #000000 300deg 310deg,
                  #ef4444 310deg 320deg,
                  #000000 320deg 330deg,
                  #ef4444 330deg 340deg,
                  #000000 340deg 350deg,
                  #ef4444 350deg 360deg
                )`,
              }}
            >
              {/* Numbers around the wheel */}
              {numbers.slice(0, 18).map((number, index) => {
                const angle = (360 / 37) * index
                return (
                  <div
                    key={number}
                    className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    <div
                      className="absolute"
                      style={{
                        top: "15px",
                        transform: `rotate(${-angle}deg)`,
                      }}
                    >
                      {number}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
            </div>

            {/* Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center z-10">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Betting Table */}
        <div className="glass p-6 rounded-2xl mb-6">
          <h3 className="text-lg font-bold mb-4 text-center">Select Bet Amount</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {betOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setBetAmount(option.value)}
                className={`w-12 h-12 rounded-full border-2 font-bold text-sm transition-all ${
                  betAmount === option.value
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-yellow-400 text-yellow-400 hover:bg-yellow-400/20"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Betting Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => placeBet("color", "red", betAmount)}
                className="bg-red-500 text-white p-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
              >
                RED
              </button>
              <button
                onClick={() => placeBet("color", "black", betAmount)}
                className="bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                BLACK
              </button>
            </div>

            {/* Number Grid (simplified) */}
            <div className="grid grid-cols-6 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => placeBet("number", num, betAmount)}
                  className={`p-2 text-xs font-bold rounded transition-colors ${
                    getNumberColor(num) === "red"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm mt-4">You have {spinsLeft} spins left today</p>
        </div>

        {/* Result Display */}
        {result && (
          <div className="glass p-6 rounded-2xl mb-6 text-center animate-scale-in">
            <h3 className="text-xl font-bold mb-2">{result.totalWin > 0 ? "You Win!" : "Better luck next time!"}</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  result.winningColor === "red"
                    ? "bg-red-500"
                    : result.winningColor === "black"
                      ? "bg-black"
                      : "bg-green-500"
                }`}
              >
                {result.winningNumber}
              </div>
              <span className="text-muted-foreground">
                {result.winningColor.charAt(0).toUpperCase() + result.winningColor.slice(1)}
              </span>
            </div>
            {result.totalWin > 0 && (
              <div className="text-3xl font-bold text-green-400">${result.totalWin.toLocaleString()}</div>
            )}
          </div>
        )}

        {/* Spin Button */}
        <AnimatedButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSpin}
          disabled={isSpinning || selectedBets.length === 0 || spinsLeft === 0}
        >
          {isSpinning ? "Spinning..." : spinsLeft === 0 ? "No Spins Left" : "Spin"}
        </AnimatedButton>
      </div>
    </div>
  )
}
