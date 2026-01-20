"use client"

import { AlertCircle, LogIn, Users } from "lucide-react"

export function GuestNudgeBlock({ type = "login", onAction }) {
  const blocks = {
    login: {
      title: "Login to place bets online",
      description: "Create a free account to place real bets, track your winnings, and access exclusive bonuses.",
      icon: LogIn,
      buttonText: "Create Account",
      href: "/auth",
    },
    tryDemo: {
      title: "Try Demo",
      description: "Build bet slips and generate BetIDs without an account. Perfect for testing your strategies.",
      icon: AlertCircle,
      buttonText: "Try Demo Now",
      href: "/guest",
    },
    agentMode: {
      title: "Are you an Agent?",
      description: "Agents can accept bets from customers and scan BetIDs. Login with agent credentials.",
      icon: Users,
      buttonText: "Agent Login",
      href: "/auth",
    },
  }

  const block = blocks[type] || blocks.login
  const Icon = block.icon

  return (
    <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/50 rounded-xl p-4 md:p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-[#FFD700]" />
        </div>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-[#F5F5F5] mb-2">{block.title}</h3>
          <p className="text-sm text-[#B8C5D6] mb-4">{block.description}</p>
          <a
            href={block.href}
            className="inline-block px-4 md:px-6 py-2 md:py-3 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold hover:bg-[#FFD700]/90 transition-all text-sm md:text-base"
          >
            {block.buttonText}
          </a>
        </div>
      </div>
    </div>
  )
}
