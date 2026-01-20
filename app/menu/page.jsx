"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { useThemeColors } from "@/hooks/useThemeColors"
import { Card } from "@/components/ui/card"
import { Trophy, Users, Settings, HelpCircle, LogOut, ChevronRight, Volume2, Globe, Shield, Wallet } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import LanguageSwitcher from "@/components/i18n/language-switcher"
import ResponsibleGaming from "@/components/compliance/responsible-gaming"
import useSWR from "swr"
import { useLanguage } from "@/lib/i18n/language-context"
import { getAuthToken } from "@/lib/auth-service"
import { CURRENCIES } from "@/lib/currency-config"

const fetcher = async (url) => {
  const token = getAuthToken()
  if (!token) throw new Error("Not authenticated")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export default function MenuPage() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { brandName, primaryColor, logoUrl } = useTenant()
  const { colors, styles } = useThemeColors()
  const { t } = useLanguage()
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [showResponsibleGaming, setShowResponsibleGaming] = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)

  const { data: walletData } = useSWR(isAuthenticated ? "/api/user/wallet" : null, fetcher)
  const { data: betsData } = useSWR(isAuthenticated ? "/api/bets?status=pending" : null, fetcher)

  const accentColor = colors.accent

  const walletCurrency = walletData?.data?.wallet?.currency || "USD"
  const currencySymbol = CURRENCIES[walletCurrency]?.symbol || "$"

  const menuItems = [
    { icon: Trophy, label: t("missions"), href: "/missions", requiresAuth: true },
    { icon: Wallet, label: t("wallet"), href: "/wallet", requiresAuth: true },
    { icon: Users, label: t("leaderboard"), href: "/leaderboard", requiresAuth: false },
    { icon: Users, label: t("friends"), href: "/friends", requiresAuth: true },
    { icon: Settings, label: t("settings"), href: "/settings", requiresAuth: true },
    { icon: HelpCircle, label: t("helpSupport"), href: "/help", requiresAuth: false },
    { icon: Shield, label: t("responsibleGaming"), onClick: () => setShowResponsibleGaming(true), requiresAuth: false },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={styles.pageBg}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: accentColor }}
        ></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={styles.pageBg}>
      <BettingHeader />

      <main className="container mx-auto px-4 py-36">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("menu")}</h1>
            <button
              onClick={() => setShowLanguageSwitcher(!showLanguageSwitcher)}
              className="px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              style={{ backgroundColor: colors.bgMuted, color: accentColor }}
            >
              <Globe className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">{t("language")}</span>
            </button>
          </div>

          {/* Language Switcher Dropdown */}
          {showLanguageSwitcher && (
            <div
              className="mb-6 p-4 rounded-lg border"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: accentColor }}>
                {t("selectLanguage")}
              </h3>
              <LanguageSwitcher />
            </div>
          )}

          {/* User Profile Card - Only for authenticated users */}
          {isAuthenticated && user && (
            <Card className="p-6 mb-6" style={{ backgroundColor: `${colors.bgMuted}80`, borderColor: colors.border }}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  👨‍💼
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{user.username || user.email}</h3>
                  <p style={{ color: colors.textMuted }} className="text-sm">
                    {t("playerAccount")}
                  </p>
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: colors.bgDark, borderColor: `${accentColor}50` }}
                >
                  <p className="text-sm mb-1" style={{ color: colors.textMuted }}>
                    {t("balance")}
                  </p>
                  <h3 className="text-2xl font-bold" style={{ color: accentColor }}>
                    {currencySymbol}
                    {(walletData?.data?.wallet?.balance ?? 0).toFixed(2)}
                  </h3>
                </div>
                <div className="rounded-xl p-4 border border-green-500/50" style={{ backgroundColor: colors.bgDark }}>
                  <p className="text-sm mb-1" style={{ color: colors.textMuted }}>
                    {t("openBets")}
                  </p>
                  <h3 className="text-2xl font-bold text-green-400">{betsData?.pagination?.total || 0}</h3>
                </div>
              </div>
            </Card>
          )}

          {/* Menu Items */}
          <div className="space-y-3">
            {menuItems
              .filter((item) => !item.requiresAuth || isAuthenticated)
              .map((item, index) => (
                <div key={index}>
                  {item.href ? (
                    <Link href={item.href}>
                      <div
                        className="w-full p-4 rounded-xl flex items-center gap-4 transition-colors cursor-pointer border"
                        style={{ backgroundColor: `${colors.bgMuted}80`, borderColor: colors.border }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${accentColor}20` }}
                        >
                          <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
                      </div>
                    </Link>
                  ) : item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="w-full p-4 rounded-xl flex items-center gap-4 transition-colors border"
                      style={{ backgroundColor: `${colors.bgMuted}80`, borderColor: colors.border }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}20` }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                      </div>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
                    </button>
                  ) : null}
                </div>
              ))}

            {/* Audio Toggle */}
            <div
              className="w-full p-4 rounded-xl flex items-center gap-4 border"
              style={{ backgroundColor: `${colors.bgMuted}80`, borderColor: colors.border }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Volume2 className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <span className="flex-1 text-left font-medium">{t("audioMusic")}</span>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                  audioEnabled ? "" : "bg-gray-600"
                }`}
                style={{ backgroundColor: audioEnabled ? accentColor : undefined }}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    audioEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Login/Logout */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-4 hover:bg-red-500/20 transition-colors text-red-400"
              >
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left font-medium">{t("logout")}</span>
              </button>
            ) : (
              <Link href="/auth">
                <div
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-colors font-bold"
                  style={{
                    background: `linear-gradient(to right, ${accentColor}, ${accentColor}CC)`,
                    color: colors.accentForeground,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.bgDark}33` }}
                  >
                    <LogOut className="w-5 h-5 rotate-180" />
                  </div>
                  <span className="flex-1 text-left">{t("loginSignup")}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Responsible Gaming Modal */}
      {showResponsibleGaming && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          >
            <div
              className="sticky top-0 border-b px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <h2 className="text-2xl font-bold">{t("responsibleGaming")}</h2>
              <button
                onClick={() => setShowResponsibleGaming(false)}
                className="text-2xl"
                style={{ color: colors.textMuted }}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ResponsibleGaming />
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && <BottomNavigation activeTab="menu" />}
    </div>
  )
}
