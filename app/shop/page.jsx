"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Gift, Star, Zap, Crown, Sparkles, Ticket, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export default function ShopPage() {
  const { isAuthenticated, loading } = useAuth()
  const { brandName, primaryColor } = useTenant()
  const { t } = useLanguage()

  const accentColor = primaryColor || "#FFD700"

  const shopItems = [
    {
      id: 1,
      name: t("luckyCharmPack"),
      description: t("luckyCharmDesc"),
      price: 299,
      icon: Gift,
      color: "text-yellow-500",
      popular: true,
    },
    {
      id: 2,
      name: t("doubleXpBoost"),
      description: t("doubleXpDesc"),
      price: 199,
      icon: Star,
      color: "text-blue-500",
    },
    {
      id: 3,
      name: t("spinMultiplier"),
      description: t("spinMultiplierDesc"),
      price: 499,
      icon: Zap,
      color: "text-purple-500",
    },
    {
      id: 4,
      name: t("vipPass"),
      description: t("vipPassDesc"),
      price: 999,
      icon: Crown,
      color: "text-amber-500",
      popular: true,
    },
    {
      id: 5,
      name: t("freeBetToken"),
      description: t("freeBetDesc"),
      price: 399,
      icon: Ticket,
      color: "text-green-500",
    },
    {
      id: 6,
      name: t("cashbackShield"),
      description: t("cashbackDesc"),
      price: 599,
      icon: Sparkles,
      color: "text-pink-500",
    },
  ]

  const handlePurchase = (item) => {
    if (!isAuthenticated) {
      window.location.href = "/auth"
      return
    }
    alert(`Demo: Purchasing ${item.name} for $${item.price}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: accentColor }}
        ></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      <BettingHeader />

      <main className="container mx-auto px-4 py-32">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1
              className="text-3xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, #FFA500)` }}
            >
              {t("shop")}
            </h1>
            <p className="text-[#B8C5D6]">{t("shopDescription")}</p>
          </div>

          {/* User Balance - Only for authenticated */}
          {isAuthenticated && (
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Trophy className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-[#B8C5D6]">{t("yourPoints")}</p>
                    <p className="text-2xl font-bold" style={{ color: accentColor }}>
                      12,500
                    </p>
                  </div>
                </div>
                <Button style={{ backgroundColor: accentColor, color: "#0A1A2F" }}>{t("getMorePoints")}</Button>
              </CardContent>
            </Card>
          )}

          {/* Shop Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopItems.map((item) => (
              <Card
                key={item.id}
                className="relative bg-[#1A2F45]/50 border-[#2A3F55] hover:border-opacity-100 transition-all duration-300 hover:scale-105"
                style={{ borderColor: item.popular ? `${accentColor}50` : undefined }}
              >
                {item.popular && (
                  <Badge
                    className="absolute -top-2 -right-2"
                    style={{ background: `linear-gradient(to right, ${accentColor}, #FFA500)` }}
                  >
                    {t("popular")}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#0A1A2F] flex items-center justify-center mb-4">
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <p className="text-sm text-[#B8C5D6]">{item.description}</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-2xl font-bold" style={{ color: accentColor }}>
                    ${item.price}
                  </div>
                  <Button
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, ${accentColor}, #FFA500)`,
                      color: "#0A1A2F",
                    }}
                    onClick={() => handlePurchase(item)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {isAuthenticated ? t("purchase") : t("loginToBuy")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {isAuthenticated && <BottomNavigation activeTab="shop" />}
    </div>
  )
}
