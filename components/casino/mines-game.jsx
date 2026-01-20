"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Bomb, Gem, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProvablyFairModal } from "./provably-fair-modal"

export function MinesGame({ result, minesCount, isPlaying, roundNumber, provablyFair, onVerify }) {
  const [revealedTiles, setRevealedTiles] = useState(new Set())
  const [isAnimating, setIsAnimating] = useState(false)
  const [explosionTiles, setExplosionTiles] = useState([])
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const gridSize = 25

  useEffect(() => {
    if (isPlaying && result) {
      setRevealedTiles(new Set())
      setExplosionTiles([])
      setIsAnimating(true)

      const revealSequence = async () => {
        for (let i = 0; i < result.minePositions.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 80))
          setRevealedTiles((prev) => new Set([...prev, result.minePositions[i]]))

          // Add explosion effect for mines
          if (true) {
            setExplosionTiles((prev) => [...prev, result.minePositions[i]])
            setTimeout(() => {
              setExplosionTiles((prev) => prev.filter((t) => t !== result.minePositions[i]))
            }, 600)
          }
        }
        setTimeout(() => setIsAnimating(false), 500)
      }

      revealSequence()
    }
  }, [isPlaying, result])

  const isMine = (index) => {
    return result?.minePositions.includes(index)
  }

  const isRevealed = (index) => {
    return revealedTiles.has(index)
  }

  const isExploding = (index) => {
    return explosionTiles.includes(index)
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-[#0A0E1A] via-[#0D1520] to-[#111827] rounded-2xl p-8 overflow-hidden">
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

      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <Gem className="text-green-400/20" size={24} />
        </motion.div>
      ))}

      <div className="text-center mb-8">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 text-4xl font-black text-yellow-400 blur-xl opacity-50">
            {minesCount} {minesCount === 1 ? "Mine" : "Mines"}
          </div>

          <div className="relative text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
            {minesCount} {minesCount === 1 ? "Mine" : "Mines"} Hidden
          </div>
        </motion.div>

        {result && !isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mt-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
              className={`text-5xl font-black mb-3 ${
                result.won
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-400 to-green-500 drop-shadow-[0_0_40px_rgba(74,222,128,0.6)]"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-500 drop-shadow-[0_0_40px_rgba(248,113,113,0.6)]"
              }`}
            >
              {result.won ? "🎉 YOU WIN!" : "💥 YOU LOSE!"}
            </motion.div>
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-[0_10px_40px_rgba(234,179,8,0.5)]">
              <span className="text-2xl font-black text-[#0A1A2F]">{result.multiplier.toFixed(2)}x Multiplier</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto mb-8">
        {Array.from({ length: gridSize }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, rotateY: 0, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            transition={{
              delay: index * 0.02,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="aspect-square relative"
          >
            <motion.div
              animate={isRevealed(index) ? { rotateY: 180 } : { rotateY: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
              className="relative w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#2A3F55] via-[#1F3448] to-[#1A2F45] border-2 border-[#3A5F75]/50 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
                  isRevealed(index) ? "invisible" : "visible"
                }`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <motion.div
                  animate={{ x: [-100, 100] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"
                />
                <div className="text-4xl text-[#4A6F85] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">?</div>
              </div>

              <div
                className={`absolute inset-0 rounded-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${
                  isMine(index)
                    ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700"
                    : "bg-gradient-to-br from-green-500 via-green-600 to-green-700"
                } ${isRevealed(index) ? "visible" : "invisible"}`}
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div
                  className={`absolute inset-0 rounded-xl ${isMine(index) ? "bg-red-400/20" : "bg-green-400/20"} blur-xl`}
                />

                {isMine(index) ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: isExploding(index) ? [1, 1.5, 1] : 1,
                      rotate: 0,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="relative z-10"
                  >
                    <Bomb className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" size={32} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="relative z-10"
                  >
                    <Gem className="text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" size={32} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-8"
        >
          <div className="relative px-8 py-4 bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-400/50 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(239,68,68,0.3)]">
            <div className="absolute inset-0 bg-red-400/10 rounded-2xl blur-xl" />
            <div className="relative text-center">
              <Bomb className="text-red-300 mx-auto mb-2" size={24} />
              <div className="text-[#E5E7EB] text-sm font-semibold">Mines</div>
              <div className="text-red-300 text-3xl font-black">{minesCount}</div>
            </div>
          </div>

          <div className="relative px-8 py-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-400/50 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(74,222,128,0.3)]">
            <div className="absolute inset-0 bg-green-400/10 rounded-2xl blur-xl" />
            <div className="relative text-center">
              <Gem className="text-green-300 mx-auto mb-2" size={24} />
              <div className="text-[#E5E7EB] text-sm font-semibold">Safe Tiles</div>
              <div className="text-green-300 text-3xl font-black">{gridSize - minesCount}</div>
            </div>
          </div>
        </motion.div>
      )}

      <ProvablyFairModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        roundData={{
          roundNumber: roundNumber,
          gameType: "mines",
          result: result?.multiplier ? `${result.multiplier.toFixed(2)}x` : "N/A",
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
