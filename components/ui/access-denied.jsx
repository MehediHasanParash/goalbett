"use client"

import { Lock } from "lucide-react"
import Link from "next/link"

export function AccessDenied({ requiredRole = "authenticated" }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-8 max-w-md w-full text-center">
        <Lock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Access Denied</h2>
        <p className="text-sm text-[#B8C5D6] mb-6">
          You don't have permission to access this resource.
          {requiredRole !== "authenticated" && ` This page requires ${requiredRole} access.`}
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full block py-3 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold hover:bg-[#FFD700]/90 transition-all text-center"
          >
            Return Home
          </Link>
          <Link
            href="/auth"
            className="w-full block py-3 bg-[#1A2F45] text-[#B8C5D6] rounded-lg font-bold hover:bg-[#2A3F55] transition-all text-center border border-[#2A3F55]"
          >
            Login Again
          </Link>
        </div>
      </div>
    </div>
  )
}
