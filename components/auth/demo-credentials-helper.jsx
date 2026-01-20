"use client"

import { Lightbulb } from "lucide-react"

export function DemoCredentialsHelper() {
  return (
    <div className="bg-[#FFD700]/10 border border-[#FFD700]/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#FFD700] text-sm mb-3">Demo Credentials (DEMO MODE ONLY)</p>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center justify-between bg-black/30 p-2 rounded">
              <span>Player:</span>
              <code className="font-mono">player@demo.com</code>
            </div>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded">
              <span>Agent:</span>
              <code className="font-mono">agent@demo.com</code>
            </div>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded">
              <span>Tenant Admin:</span>
              <code className="font-mono">tenant@demo.com</code>
            </div>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded">
              <span>Super Admin:</span>
              <code className="font-mono">superadmin@demo.com</code>
            </div>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded border-t border-[#FFD700]/30 pt-3 mt-2">
              <span>Password (all):</span>
              <code className="font-mono font-bold">demo123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
