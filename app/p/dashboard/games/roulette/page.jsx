"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"

const rouletteNumbers = [
  { number: 0, color: "green" },
  { number: 32, color: "red" },
  { number: 15, color: "black" },
  { number: 19, color: "red" },
  { number: 4, color: "black" },
  { number: 21, color: "red" },
  { number: 2, color: "black" },
  { number: 25, color: "red" },
  { number: 17, color: "black" },
  { number: 34, color: "red" },
  { number: 6, color: "black" },
  { number: 27, color: "red" },
  { number: 13, color: "black" },
  { number: 36, color: "red" },
  { number: 11, color: "black" },
  { number: 30, color: "red" },
  { number: 8, color: "black" },
  { number: 23, color: "red" },
  { number: 10, color: "black" },
  { number: 5, color: "red" },
  { number: 24, color: "black" },
  { number: 16, color: "red" },
  { number: 33, color: "black" },
  { number: 1, color: "red" },
  { number: 20, color: "black" },
  { number: 14, color: "red" },
  { number: 31, color: "black" },
  { number: 9, color: "red" },
  { number: 22, color: "black" },
  { number: 18, color: "red" },
  { number: 29, color: "black" },
  { number: 7, color: "red" },
  { number: 28, color: "black" },
  { number: 12, color: "red" },
  { number: 35, color: "black" },
  { number: 3, color: "red" },
  { number: 26, color: "black" },
]

export default function RouletteGame() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(25)
  const [balance, setBalance] = useState(5000)
  const [bets, setBets] = useState({})
  const [lastWin, setLastWin] = useState(null)
  const [winningNumber, setWinningNumber] = useState(null)
  const wheelRef = useRef(null)

  const placeBet = (betType, value) => {
    if (betAmount > balance) return

    setBets((prev) => ({
      ...prev,
      [`${betType}-${value}`]: (prev[`${betType}-${value}`] || 0) + betAmount,
    }))
    setBalance((prev) => prev - betAmount)
  }

  const clearBets = () => {
    const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
    setBets({})
    setBalance((prev) => prev + totalBets)
  }

  const handleSpin = () => {
    if (isSpinning || Object.keys(bets).length === 0) return

    setIsSpinning(true)
    setLastWin(null)

    // Random winning number
    const randomIndex = Math.floor(Math.random() * rouletteNumbers.length)
    const winning = rouletteNumbers[randomIndex]

    // Spin animation
    const randomRotation = Math.random() * 360 + 1440 // At least 4 full rotations
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`
    }

    setTimeout(() => {
      setWinningNumber(winning)

      // Calculate winnings
      let totalWin = 0
      Object.entries(bets).forEach(([betKey, betValue]) => {
        const [betType, value] = betKey.split("-")

        if (betType === "number" && Number.parseInt(value) === winning.number) {
          totalWin += betValue * 35 // 35:1 payout for straight number
        } else if (betType === "color" && value === winning.color) {
          totalWin += betValue * 2 // 1:1 payout for color
        } else if (betType === "even" && winning.number % 2 === 0 && winning.number !== 0) {
          totalWin += betValue * 2
        } else if (betType === "odd" && winning.number % 2 === 1) {
          totalWin += betValue * 2
        } else if (betType === "low" && winning.number >= 1 && winning.number <= 18) {
          totalWin += betValue * 2
        } else if (betType === "high" && winning.number >= 19 && winning.number <= 36) {
          totalWin += betValue * 2
        }
      })

      if (totalWin > 0) {
        setBalance((prev) => prev + totalWin)
        setLastWin(totalWin)
      }

      setBets({})
      setIsSpinning(false)
    }, 4000)
  }

  const adjustBet = (amount) => {
    setBetAmount((prev) => Math.max(5, Math.min(100, prev + amount)))
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/games">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">European Roulette</h1>
          <Badge variant="secondary">Balance: ${balance}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roulette Wheel */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <div className="relative w-80 h-80 mx-auto">
                  {/* Wheel */}
                  <div
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-8 border-yellow-600 relative transition-transform duration-4000 ease-out"
                    style={{
                      background: `conic-gradient(${rouletteNumbers
                        .map((num, index) => {
                          const color = num.color === "red" ? "#dc2626" : num.color === "black" ? "#1f2937" : "#059669"
                          return `${color} ${index * (360 / rouletteNumbers.length)}deg ${(index + 1) * (360 / rouletteNumbers.length)}deg`
                        })
                        .join(", ")})`,
                    }}
                  >
                    {/* Numbers */}
                    {rouletteNumbers.map((num, index) => {
                      const angle = (360 / rouletteNumbers.length) * index
                      return (
                        <div
                          key={index}
                          className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            transform: `rotate(${angle + (360 / rouletteNumbers.length) / 2}deg)`,
                            transformOrigin: "center",
                          }}
                        >
                          <span
                            className="absolute"
                            style={{
                              top: "15px",
                              transform: `rotate(-${angle + (360 / rouletteNumbers.length) / 2}deg)`,
                            }}
                          >
                            {num.number}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-600"></div>
                  </div>

                  {/* Center */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-600 rounded-full border-4 border-white"></div>
                </div>

                {/* Winning Number Display */}
                {winningNumber && (
                  <div className="text-center mt-4">
                    <div
                      className={`inline-block px-4 py-2 rounded-full text-white font-bold text-xl ${
                        winningNumber.color === "red"
                          ? "bg-red-600"
                          : winningNumber.color === "black"
                            ? "bg-gray-800"
                            : "bg-green-600"
                      }`}
                    >
                      {winningNumber.number}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Betting Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bet Amount */}
            <Card>
              <CardHeader>
                <CardTitle>Bet Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={() => adjustBet(-5)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-xl">${betAmount}</span>
                  <Button size="sm" variant="outline" onClick={() => adjustBet(5)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((amount) => (
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
              </CardContent>
            </Card>

            {/* Betting Options */}
            <Card>
              <CardHeader>
                <CardTitle>Place Bets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Bets */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => placeBet("color", "red")}
                    disabled={isSpinning}
                  >
                    Red (1:1)
                  </Button>
                  <Button
                    className="bg-gray-800 hover:bg-gray-900"
                    onClick={() => placeBet("color", "black")}
                    disabled={isSpinning}
                  >
                    Black (1:1)
                  </Button>
                </div>

                {/* Even/Odd */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => placeBet("even", "even")} disabled={isSpinning}>
                    Even (1:1)
                  </Button>
                  <Button variant="outline" onClick={() => placeBet("odd", "odd")} disabled={isSpinning}>
                    Odd (1:1)
                  </Button>
                </div>

                {/* High/Low */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => placeBet("low", "1-18")} disabled={isSpinning}>
                    1-18 (1:1)
                  </Button>
                  <Button variant="outline" onClick={() => placeBet("high", "19-36")} disabled={isSpinning}>
                    19-36 (1:1)
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button variant="outline" onClick={clearBets} disabled={isSpinning}>
                    Clear Bets
                  </Button>
                  <Button
                    onClick={handleSpin}
                    disabled={isSpinning || Object.keys(bets).length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSpinning ? "Spinning..." : "SPIN"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Bets */}
            {Object.keys(bets).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(bets).map(([betKey, betValue]) => (
                      <div key={betKey} className="flex justify-between text-sm">
                        <span>{betKey.replace("-", ": ")}</span>
                        <span className="font-bold">${betValue}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${Object.values(bets).reduce((sum, bet) => sum + bet, 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Win */}
            {lastWin && (
              <Card className="border-green-500 bg-green-500/10">
                <CardHeader>
                  <CardTitle className="text-green-500">You Won!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">${lastWin}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
