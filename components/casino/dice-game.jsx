"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Sparkles, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProvablyFairModal } from "./provably-fair-modal"

export function DiceGame({ result, target, rollType, isRolling, roundNumber, provablyFair, onVerify }) {
  const [displayValue, setDisplayValue] = useState(50)
  const [isAnimating, setIsAnimating] = useState(false)
  const [particles, setParticles] = useState([])
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true)
      let count = 0
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 100))
        count++
        if (count > 20) {
          clearInterval(interval)
        }
      }, 50)

      return () => clearInterval(interval)
    }
  }, [isRolling])

  useEffect(() => {
    if (result && !isRolling) {
      setTimeout(() => {
        setDisplayValue(result.rollValue)
        setIsAnimating(false)

        if (result.won) {
          const newParticles = Array.from({ length: 30 }).map((_, i) => ({
            id: Math.random(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: i * 0.02,
            duration: 1 + Math.random() * 0.5,
          }))
          setParticles(newParticles)
          setTimeout(() => setParticles([]), 2000)
        }
      }, 100)
    }
  }, [result, isRolling])

  const getWinZone = () => {
    if (rollType === "over") {
      return { start: target, end: 100 }
    } else {
      return { start: 0, end: target }
    }
  }

  const winZone = getWinZone()
  const isInWinZone = result && displayValue >= winZone.start && displayValue <= winZone.end

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-[#0A0E1A] via-[#0D1520] to-[#111827] rounded-2xl p-8 overflow-hidden">
      {result && !isAnimating && (
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

      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-yellow-500/10 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-green-500/10 to-transparent blur-3xl"
      />

      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              y: `${particle.y - 50}%`,
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut",
            }}
            className="absolute pointer-events-none"
          >
            <Sparkles className="text-yellow-400" size={16} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative mb-8 flex justify-center">
        <motion.div
          animate={
            isAnimating
              ? {
                  rotateX: [0, 360, 720],
                  rotateY: [0, 360, 720],
                  rotateZ: [0, 180, 360],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: isAnimating ? Number.POSITIVE_INFINITY : 0,
            ease: "linear",
          }}
          className="relative preserve-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            animate={
              isAnimating
                ? {
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }
                : {}
            }
            transition={{ duration: 0.5, repeat: isAnimating ? Number.POSITIVE_INFINITY : 0 }}
            className="absolute inset-0 w-40 h-40 bg-yellow-400/30 rounded-3xl blur-2xl"
          />

          <div className="relative w-40 h-40 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl shadow-[0_20px_60px_rgba(234,179,8,0.4)] flex items-center justify-center border-4 border-yellow-300/40">
            <motion.div
              animate={
                isAnimating
                  ? {
                      x: [-100, 200],
                      opacity: [0, 0.5, 0],
                    }
                  : {}
              }
              transition={{ duration: 1, repeat: isAnimating ? Number.POSITIVE_INFINITY : 0 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-3xl"
            />

            <motion.div
              key={displayValue}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <span className="text-7xl font-black text-[#0A1A2F] drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                {displayValue}
              </span>
              <div className="absolute inset-0 text-7xl font-black text-yellow-200 blur-sm opacity-50 -z-10">
                {displayValue}
              </div>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {result && !isAnimating && (
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute -top-6 -right-6"
            >
              <div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl ${
                  result.won
                    ? "bg-gradient-to-br from-green-400 to-green-600 shadow-[0_0_30px_rgba(74,222,128,0.6)]"
                    : "bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_30px_rgba(248,113,113,0.6)]"
                }`}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  {result.won ? "🎉" : "💥"}
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className={`absolute inset-0 rounded-full border-4 ${
                    result.won ? "border-green-400" : "border-red-400"
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="relative h-24 bg-gradient-to-b from-[#1A2332] to-[#0F1419] rounded-2xl overflow-hidden border-2 border-[#2A3F55]/50 shadow-inner">
          <motion.div
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="absolute top-0 h-full bg-gradient-to-r from-green-500/20 via-green-400/30 to-green-500/20 bg-[length:200%_100%]"
            style={{
              left: `${winZone.start}%`,
              width: `${winZone.end - winZone.start}%`,
            }}
          >
            <motion.div
              animate={{ x: [-100, 400] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2"
            />
          </motion.div>

          <div
            className="absolute top-0 h-full bg-red-500/10"
            style={{
              left: rollType === "over" ? "0%" : `${target}%`,
              width: rollType === "over" ? `${target}%` : `${100 - target}%`,
            }}
          />

          <div className="absolute top-0 h-full w-1 z-10" style={{ left: `${target}%` }}>
            <motion.div
              animate={{ scaleY: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-0 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_20px_rgba(253,224,71,0.8)]"
            />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-[#0A1A2F] text-sm font-bold rounded-full whitespace-nowrap shadow-lg">
              Target: {target}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={displayValue}
              initial={{ left: "50%", scale: 0 }}
              animate={{ left: `${displayValue}%`, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className={`absolute inset-0 w-6 h-6 rounded-full ${
                  isInWinZone ? "bg-green-400" : "bg-red-400"
                } blur-lg`}
              />
              <div
                className={`relative w-6 h-6 rounded-full ${
                  isInWinZone
                    ? "bg-gradient-to-br from-green-300 to-green-500 shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    : "bg-gradient-to-br from-red-300 to-red-500 shadow-[0_0_20px_rgba(248,113,113,0.8)]"
                } border-2 border-white/50`}
              />
            </motion.div>
          </AnimatePresence>

          {[0, 25, 50, 75, 100].map((val) => (
            <div
              key={val}
              className="absolute bottom-2 text-[#8A9DB8] text-sm font-semibold"
              style={{ left: `${val}%`, transform: "translateX(-50%)" }}
            >
              {val}
            </div>
          ))}
        </div>

        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="text-center mt-6"
        >
          <span className="text-[#8A9DB8] text-lg">Roll </span>
          <span className="text-yellow-400 font-black text-xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            {rollType.toUpperCase()}
          </span>
          <span className="text-[#8A9DB8] text-lg"> {target}</span>
        </motion.div>
      </div>

      {result && !isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mt-8 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
            className={`text-5xl font-black mb-3 ${
              result.won
                ? "text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-green-500 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]"
                : "text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-500 drop-shadow-[0_0_30px_rgba(248,113,113,0.5)]"
            }`}
          >
            {result.won ? "YOU WIN!" : "YOU LOSE"}
          </motion.div>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-[0_10px_40px_rgba(234,179,8,0.4)]">
            <span className="text-3xl font-black text-[#0A1A2F]">{result.multiplier.toFixed(2)}x</span>
          </div>
        </motion.div>
      )}

      <ProvablyFairModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        roundData={{
          roundNumber: roundNumber,
          gameType: "dice",
          result: result?.rollValue ? `Rolled ${result.rollValue}` : "N/A",
          provablyFair: provablyFair,
        }}
        onVerify={onVerify}
      />

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  )
}
