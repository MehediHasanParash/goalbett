"use client"
import { Suspense } from "react"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { InPlayContent } from "@/components/shared/in-play-content"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useThemeColors } from "@/hooks/useThemeColors"
import { Loader2 } from "lucide-react"

function InPlayLoading() {
  const { colors } = useThemeColors()
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-12">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    </div>
  )
}

export default function InPlayPage() {
  const { isLoading: tenantLoading } = useTenant()
  const { isAuthenticated, loading } = useAuth()
  const { styles } = useThemeColors()

  if (loading || tenantLoading) return null

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={styles.pageBg}>
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
