"use client"
import { motion } from "framer-motion"
import Image from "next/image"

export const AnimatedCricketIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ rotate: [0, 10, -10, 0] }}
    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/cricket-ball.png"
      alt="Cricket"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedSoccerIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ rotate: 360 }}
    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/soccer-ball.png"
      alt="Soccer"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedCasinoIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ rotate: [0, 5, -5, 0] }}
    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-lg opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/casino.png"
      alt="Casino"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedBasketballIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/basketball-ball.png"
      alt="Basketball"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedHorsesIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ x: [0, 5, 0] }}
    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/horse-racing.png"
      alt="Horse Racing"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedEsportsIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-lg opacity-90 pointer-events-none"
      animate={{ opacity: [0.9, 1, 0.9] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/esports.png"
      alt="Esports"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedTennisIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ rotate: [0, 15, -15, 0] }}
    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/tennis-ball.png"
      alt="Tennis"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedVirtualIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/virtual.png"
      alt="Virtual"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedBoxingIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ x: [-3, 3, -3] }}
    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/boxing.png"
      alt="Boxing"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedGolfIcon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ rotate: [0, 20, 0] }}
    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/golf.png"
      alt="Golf"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)

export const AnimatedFormula1Icon = ({ className = "w-12 h-12" }) => (
  <motion.div
    className={`${className} relative pointer-events-none`}
    animate={{ x: [0, 10, 0] }}
    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[#FFD700] rounded-full opacity-90 pointer-events-none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
    />
    <Image
      src="/sports/formula1.png"
      alt="Formula 1"
      width={48}
      height={48}
      className="relative z-10 w-full h-full object-contain pointer-events-none"
    />
  </motion.div>
)
