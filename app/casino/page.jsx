"use client"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { CasinoContent } from "@/components/shared/casino-content"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useThemeColors } from "@/hooks/useThemeColors"

export default function CasinoPage() {
  const { isLoading: tenantLoading } = useTenant()
  const { isAuthenticated, loading } = useAuth()
  const { styles } = useThemeColors()

  if (loading || tenantLoading) return null

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={styles.pageBg}>
      <BettingHeader />
      <div className="pt-28 pb-24">
        <CasinoContent />
      </div>
      {isAuthenticated && <BottomNavigation activeTab="casino" />}
    </div>
  )
}
