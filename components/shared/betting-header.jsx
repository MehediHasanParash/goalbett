"use client"
import { useState } from "react"
import { useTenant } from "@/components/providers/tenant-provider"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/ui/logo"
import { BrandedButton } from "@/components/ui/branded-button"
import { Search, MenuIcon, X, UserCircle, Wallet, Globe, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"
import LanguageSwitcher from "@/components/i18n/language-switcher"
import { useLanguage } from "@/lib/i18n/language-context"
import { useWallet } from "@/hooks/useWallet"
import { CURRENCIES } from "@/lib/currency-config"
import { useThemeColors } from "@/hooks/useThemeColors"

export function BettingHeader() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { brandName } = useTenant()
  const { colors } = useThemeColors()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)
  const { t } = useLanguage()
  const { wallet } = useWallet()

  const handleLogout = () => {
    logout()
  }

  const sportsLink = "/"
  const inPlayLink = "/in-play"
  const casinoLink = "/casino"
  const walletLink = "/wallet"
  const settingsLink = "/settings"
  const helpLink = "/help"

  const walletCurrency = wallet?.currency || "USD"
  const currencySymbol = CURRENCIES[walletCurrency]?.symbol || "$"

  if (loading) {
    return (
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b"
        style={{ backgroundColor: `${colors.bgDark}f2`, borderColor: colors.border }}
      >
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              <Logo size="large" />
              <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm">
                <span style={{ color: colors.textMuted }}>{t("sports")}</span>
                <span style={{ color: colors.textMuted }}>{t("inPlay")}</span>
                <span style={{ color: colors.textMuted }}>{t("casino")}</span>
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="animate-pulse rounded-lg h-8 w-24" style={{ backgroundColor: colors.bgMuted }}></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b"
      style={{ backgroundColor: `${colors.bgDark}f2`, borderColor: colors.border }}
    >
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Nav */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            <Logo size="large" />
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm">
              <Link
                href={sportsLink}
                className="hover:opacity-80 transition-colors"
                style={{ color: colors.textMuted }}
              >
                {t("sports")}
              </Link>
              <Link
                href={inPlayLink}
                className="hover:opacity-80 transition-colors"
                style={{ color: colors.textMuted }}
              >
                {t("inPlay")}
              </Link>
              <Link
                href={casinoLink}
                className="hover:opacity-80 transition-colors"
                style={{ color: colors.textMuted }}
              >
                {t("casino")}
              </Link>
              <Link
                href={helpLink}
                className="hover:opacity-80 transition-colors flex items-center gap-1"
                style={{ color: colors.textMuted }}
              >
                <HelpCircle className="w-4 h-4" />
                {t("helpCenter") || "Help"}
              </Link>
            </nav>
          </div>

          {/* Right: Search, Auth Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block w-32 md:w-48 lg:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: colors.textMuted }}
              />
              <input
                type="text"
                placeholder={t("search")}
                className="pl-10 pr-4 py-2 w-full rounded-lg text-sm focus:outline-none"
                style={{
                  backgroundColor: colors.bgMuted,
                  borderColor: colors.border,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              />
            </div>

            <Link
              href={helpLink}
              className="p-2 rounded-lg transition-colors"
              title={t("helpCenter") || "Help Center"}
              style={{ color: colors.accent }}
            >
              <HelpCircle className="h-5 w-5" />
            </Link>

            {/* Language Switcher Button */}
            <button
              onClick={() => setShowLanguageSwitcher(!showLanguageSwitcher)}
              className="p-2 rounded-lg transition-colors"
              title={t("language")}
              style={{ color: colors.textMuted }}
            >
              <Globe className="h-5 w-5" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Wallet Link */}
                <Link
                  href={walletLink}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors border"
                  style={{
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.border,
                  }}
                >
                  <Wallet className="h-4 w-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-medium hidden md:block" style={{ color: colors.text }}>
                    {currencySymbol}
                    {wallet?.balance?.toFixed(2) || "0.00"}
                  </span>
                </Link>

                {/* User Menu */}
                <Link href={settingsLink} className="p-2 rounded-lg transition-colors">
                  <UserCircle className="h-5 w-5" style={{ color: colors.textMuted }} />
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm hidden md:block">{t("logout")}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth?tab=login">
                  <BrandedButton variant="outline" size="sm" showLogo={false}>
                    {t("login")}
                  </BrandedButton>
                </Link>
                <Link href="/auth?tab=register" className="hidden sm:block">
                  <BrandedButton size="sm" showLogo={false}>
                    {t("register")}
                  </BrandedButton>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" style={{ color: colors.textMuted }} />
              ) : (
                <MenuIcon className="h-5 w-5" style={{ color: colors.textMuted }} />
              )}
            </button>
          </div>
        </div>

        {/* Language Switcher Dropdown */}
        {showLanguageSwitcher && (
          <div className="absolute right-4 top-16 z-50">
            <LanguageSwitcher onClose={() => setShowLanguageSwitcher(false)} />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4" style={{ borderColor: colors.border }}>
            <nav className="flex flex-col space-y-3">
              <Link
                href={sportsLink}
                className="transition-colors"
                style={{ color: colors.textMuted }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("sports")}
              </Link>
              <Link
                href={inPlayLink}
                className="transition-colors"
                style={{ color: colors.textMuted }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("inPlay")}
              </Link>
              <Link
                href={casinoLink}
                className="transition-colors"
                style={{ color: colors.textMuted }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("casino")}
              </Link>
              <Link
                href={helpLink}
                className="transition-colors flex items-center gap-2"
                style={{ color: colors.accent }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <HelpCircle className="w-4 h-4" />
                {t("helpCenter") || "Help Center"}
              </Link>

              {/* Mobile Search */}
              <div className="relative sm:hidden">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: colors.textMuted }}
                />
                <input
                  type="text"
                  placeholder={t("search")}
                  className="pl-10 pr-4 py-2 w-full rounded-lg text-sm focus:outline-none border"
                  style={{
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
