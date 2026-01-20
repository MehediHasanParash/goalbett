"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Rocket, TrendingUp, Flame, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProvablyFairModal } from "./provably-fair-modal"

export function CrashGame({ result, autoCashout, isPlaying, roundNumber, provablyFair, onVerify }) {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [hasCrashed, setHasCrashed] = useState(false)
  const [graphPoints, setGraphPoints] = useState([{ x: 0, y: 1 }])
  const [rocketTrail, setRocketTrail] = useState([])
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const animationRef = useRef()
  const startTimeRef = useRef()

  useEffect(() => {
    if (isPlaying && result) {
      setHasCrashed(false)
      setGraphPoints([{ x: 0, y: 1 }])
      setRocketTrail([])
      startTimeRef.current = Date.now()

      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const crashPoint = result.crashPoint

        const multiplier = Math.min(1 + elapsed * 0.5 + elapsed * elapsed * 0.1, crashPoint)
        setCurrentMultiplier(multiplier)

        setGraphPoints((prev) => [...prev.slice(-50), { x: elapsed, y: multiplier }])

        setRocketTrail((prev) => [
          ...prev.slice(-15),
          {
            x: elapsed,
            y: multiplier,
            id: Math.random(),
          },
        ])

        if (multiplier >= crashPoint) {
          setHasCrashed(true)
          setCurrentMultiplier(crashPoint)
          cancelAnimationFrame(animationRef.current)
        } else {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isPlaying, result])

  const createPath = () => {
    if (graphPoints.length < 2) return ""
    const maxX = Math.max(...graphPoints.map((p) => p.x), 5)
    const maxY = Math.max(...graphPoints.map((p) => p.y), 2)
    const scaleX = 380 / maxX
    const scaleY = 200 / maxY

    const pathData = graphPoints.map((point, idx) => {
      const x = point.x * scaleX
      const y = 220 - point.y * scaleY
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`
    })

    return pathData.join(" ")
  }

  return (
    <div className="relative w-full h-full min-h-[450px] bg-gradient-to-br from-[#0A0E1A] via-[#0D1520] to-[#111827] rounded-2xl p-8 overflow-hidden">
      {result && hasCrashed && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowVerifyModal(true)}
            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 gap-2"
          >
            <Shield className="w-4 h-4" />
            Verify
          </Button>
        </div>
      )}

      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: ["-100%", "100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 3,
            ease: "linear",
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="absolute top-8 left-8 z-10">
        <motion.div
          key={Math.floor(currentMultiplier * 10)}
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.1, 1] }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <div
            className={`absolute inset-0 text-8xl font-black blur-2xl ${
              hasCrashed ? "text-red-500" : "text-green-400"
            } opacity-50`}
          >
            {currentMultiplier.toFixed(2)}x
          </div>

          <div
            className={`relative text-8xl font-black ${
              hasCrashed
                ? "text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-red-500 to-red-600"
                : "text-transparent bg-clip-text bg-gradient-to-br from-green-300 via-green-400 to-green-500"
            } drop-shadow-[0_0_40px_rgba(74,222,128,0.6)]`}
          >
            {currentMultiplier.toFixed(2)}x
          </div>

          {!hasCrashed && (
            <motion.div
              animate={{ y: [-5, -15, -5], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
              className="absolute -right-12 top-1/2 -translate-y-1/2"
            >
              <TrendingUp className="text-green-400" size={32} />
            </motion.div>
          )}
        </motion.div>

        {autoCashout && !hasCrashed && (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="mt-3 px-4 py-2 bg-yellow-400/20 border-2 border-yellow-400 rounded-full backdrop-blur-sm"
          >
            <span className="text-yellow-300 text-lg font-bold">Auto Cashout: {autoCashout.toFixed(2)}x</span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {hasCrashed && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-96 h-96 rounded-full bg-gradient-radial from-red-500 via-orange-500 to-transparent"
            />
            <motion.div
              initial={{ scale: 0, rotate: 0, opacity: 1 }}
              animate={{ scale: 2, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <div className="text-[200px] drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]">💥</div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            >
              <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-red-500 to-red-600 drop-shadow-[0_0_60px_rgba(239,68,68,0.8)] animate-pulse">
                CRASHED!
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-8 right-8">
        <svg width="100%" height="240" className="overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={hasCrashed ? "#EF4444" : "#10B981"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={hasCrashed ? "#DC2626" : "#059669"} stopOpacity="1" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={hasCrashed ? "#EF4444" : "#10B981"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={hasCrashed ? "#DC2626" : "#059669"} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((val) => (
            <g key={val}>
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                x1="0"
                y1={220 - val * 55}
                x2="380"
                y2={220 - val * 55}
                stroke="#2A3F55"
                strokeWidth="1"
                strokeDasharray="8 8"
                opacity="0.3"
              />
              <text x="-5" y={225 - val * 55} fill="#8A9DB8" fontSize="12" textAnchor="end" fontWeight="600">
                {val}x
              </text>
            </g>
          ))}

          <motion.path
            d={`${createPath()} L 380 220 L 0 220 Z`}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          />

          <motion.path
            d={createPath()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {rocketTrail.map((trail, idx) => {
            const maxX = Math.max(...graphPoints.map((p) => p.x), 5)
            const maxY = Math.max(...graphPoints.map((p) => p.y), 2)
            const x = (trail.x * 380) / maxX
            const y = 220 - (trail.y * 200) / maxY

            return (
              <motion.circle
                key={trail.id}
                cx={x}
                cy={y}
                r="3"
                fill={hasCrashed ? "#EF4444" : "#FFD700"}
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8 }}
              />
            )
          })}

          {graphPoints.length > 0 && (
            <motion.g
              animate={{
                x:
                  (graphPoints[graphPoints.length - 1].x * 380) / Math.max(5, Math.max(...graphPoints.map((p) => p.x))),
                y:
                  220 -
                  (graphPoints[graphPoints.length - 1].y * 200) / Math.max(2, Math.max(...graphPoints.map((p) => p.y))),
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <circle r="20" fill={hasCrashed ? "#EF4444" : "#FFD700"} opacity="0.3" filter="blur(8px)" />

              {!hasCrashed && (
                <motion.g
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Flame
                    className="text-orange-500"
                    size={24}
                    style={{ transform: "translate(-12px, 8px) rotate(180deg)" }}
                    fill="currentColor"
                  />
                </motion.g>
              )}

              <motion.g
                animate={
                  !hasCrashed
                    ? {
                        rotate: [0, -5, 5, 0],
                        y: [-2, 2, -2],
                      }
                    : {
                        rotate: [0, 360],
                        scale: [1, 0],
                      }
                }
                transition={{ duration: hasCrashed ? 0.5 : 0.8, repeat: hasCrashed ? 0 : Number.POSITIVE_INFINITY }}
              >
                <circle r="12" fill={hasCrashed ? "#DC2626" : "#FBBF24"} />
                <Rocket
                  className={hasCrashed ? "text-white" : "text-[#0A1A2F]"}
                  size={20}
                  style={{ transform: "translate(-10px, -10px) rotate(-45deg)" }}
                />
              </motion.g>
            </motion.g>
          )}
        </svg>
      </div>

      {result && hasCrashed && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute top-32 left-8 z-20"
        >
          <div
            className={`relative px-8 py-6 rounded-2xl backdrop-blur-xl border-2 ${
              result.won
                ? "bg-green-500/20 border-green-400/50 shadow-[0_20px_60px_rgba(74,222,128,0.4)]"
                : "bg-red-500/20 border-red-400/50 shadow-[0_20px_60px_rgba(248,113,113,0.4)]"
            }`}
          >
            <div
              className={`absolute inset-0 rounded-2xl blur-xl ${result.won ? "bg-green-400/30" : "bg-red-400/30"}`}
            />

            <div className="relative">
              <div className={`text-3xl font-black mb-2 ${result.won ? "text-green-300" : "text-red-300"}`}>
                {result.won ? "🎉 Cashed Out!" : "💥 Too Late!"}
              </div>
              <div className="text-xl text-[#E5E7EB] font-semibold">
                Crashed at <span className="text-yellow-300">{result.crashPoint.toFixed(2)}x</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <ProvablyFairModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        roundData={{
          roundNumber: roundNumber,
          gameType: "crash",
          result: result?.crashPoint ? `${result.crashPoint.toFixed(2)}x` : "N/A",
          provablyFair: provablyFair,
        }}
        onVerify={onVerify}
      />
    </div>
  )
}
