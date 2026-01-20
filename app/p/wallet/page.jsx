"use client"

import { useEffect } from "react"
import { Wallet } from "@/components/dashboard/wallet"

export default function WalletPage() {
  useEffect(() => {
    // Check if user is authenticated
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null

    if (!user) {
      // Redirect to auth unified page with join tab
      window.location.href = "/auth/unified?tab=join"
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Wallet />
    </div>
  )
}
