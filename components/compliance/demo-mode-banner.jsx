"use client"

import { AlertCircle } from "lucide-react"

export default function DemoModeBanner() {
  const isDemoMode = localStorage.getItem("demoMode") === "true" || true // Always show in demo

  if (!isDemoMode) return null

  return (
    <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/50 rounded-lg p-3 mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-[#FFD700]">DEMO MODE</p>
        <p className="text-xs text-[#B8C5D6] mt-1">
          This is a simulated environment. No real money is involved. Use demo credentials to explore all features.
        </p>
      </div>
    </div>
  )
}
