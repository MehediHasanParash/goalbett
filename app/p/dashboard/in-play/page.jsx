"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { InPlayContent } from "@/components/shared/in-play-content"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"

function InPlayLoading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-12">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <span className="ml-2 text-muted-foreground">Loading live events...</span>
      </div>
    </div>
  )
}

export default function DashboardInPlayPage() {
  const { isAuthenticated, loading } = useAuth()
  const { isLoading: tenantLoading } = useTenant()

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] relative overflow-x-hidden">
      <BettingHeader />
      <div className="pt-28 pb-24">
        <Suspense fallback={<InPlayLoading />}>
          <InPlayContent />
        </Suspense>
      </div>
      {isAuthenticated && <BottomNavigation activeTab="sports" />}
    </div>
  )
}
