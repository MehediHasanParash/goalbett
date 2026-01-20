"use client"

import { AlertCircle, Heart } from "lucide-react"

export function ResponsibleGamingNudge({ type = "info" }) {
  const content = {
    login: {
      title: "Responsible Gaming",
      message: "Gamble responsibly. Set limits, take breaks, and play for fun.",
      icon: Heart,
    },
    betSlip: {
      title: "Check Your Limits",
      message: "Only bet what you can afford to lose. Gambling should be fun, not a problem.",
      icon: AlertCircle,
    },
    account: {
      title: "Manage Your Account",
      message: "Set deposit limits, time-outs, or self-exclude if needed.",
      icon: AlertCircle,
    },
    info: {
      title: "Responsible Gaming",
      message: "Gamble responsibly. Set limits, take breaks, and play for fun.",
      icon: AlertCircle,
    },
  }

  const current = content[type] || content.info
  const Icon = current?.icon || AlertCircle

  return (
    <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-blue-400 text-sm">{current.title}</p>
        <p className="text-xs text-blue-300/80 mt-1">{current.message}</p>
      </div>
    </div>
  )
}
