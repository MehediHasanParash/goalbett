"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import TopUpWithdraw from "@/components/wallet/top-up-withdraw"
import { useLanguage } from "@/lib/i18n/language-context"

export default function WalletPage() {
  const router = useRouter()
  const { isLoading: tenantLoading, primaryColor } = useTenant()
  const { isAuthenticated, loading } = useAuth()
  const { t } = useLanguage()

  const accentColor = primaryColor || "#FFD700"

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [loading, isAuthenticated, router])

  if (loading || tenantLoading) return null
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] relative overflow-x-hidden">
      <BettingHeader />
      <div className="py-36">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl text-center font-bold" style={{ color: accentColor }}>
              {t("walletManagement")}
            </h1>
            <p className="text-[#B8C5D6] text-center">{t("walletDescription")}</p>
          </div>
          <TopUpWithdraw />
        </div>
      </div>
      <BottomNavigation activeTab="menu" />
    </div>
  )
}
