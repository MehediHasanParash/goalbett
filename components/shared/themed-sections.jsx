"use client"

import { useTenant } from "@/components/providers/tenant-provider"
import { BrandedButton } from "@/components/ui/branded-button"
import { MonitorDot, Trophy, Sparkles, Zap, TrendingUp, Star, Flame, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Helper to get current theme
const useCurrentTheme = () => {
  const { designId } = useTenant()
  return designId || "classic"
}

// =
// HERO SECTION - Different layouts per theme
// =
export function ThemedHeroSection({ displayName, isAuthenticated, t, colors }) {
  const theme = useCurrentTheme()

  // CLASSIC THEME - Side by side cards with gradient overlay
  if (theme === "classic") {
    return (
      <div
        className="border rounded-2xl p-6 md:p-8 shadow-2xl mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${colors.bgCard}, ${colors.bgMuted}, ${colors.bgCard})`,
          borderColor: `${colors.accent}4d`,
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <Image src="/sports-betting-interface.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div
              className="relative h-48 rounded-xl overflow-hidden border-2 group"
              style={{ borderColor: `${colors.accent}80` }}
            >
              <Image
                src="/background1.jpg"
                alt="Sports Betting"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div
                className="absolute inset-0 flex items-end p-4"
                style={{
                  background: `linear-gradient(to top, ${colors.bgDark}, transparent, transparent)`,
                }}
              >
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: colors.accent }}>
                    {t("sportsBetting")}
                  </h3>
                  <p className="text-sm" style={{ color: colors.text }}>
                    {t("liveOddsOnMatches")}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/casino">
              <div
                className="relative h-48 rounded-xl overflow-hidden border-2 group"
                style={{ borderColor: `${colors.accent}80` }}
              >
                <Image
                  src="/casino-roulette-table.jpg"
                  alt="Casino Games"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0 flex items-end p-4"
                  style={{
                    background: `linear-gradient(to top, ${colors.bgDark}, transparent, transparent)`,
                  }}
                >
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: colors.accent }}>
                      {t("casinoGames")}
                    </h3>
                    <p className="text-sm" style={{ color: colors.text }}>
                      {t("slotsRouletteBlackjack")}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="text-center pb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: colors.text }}>
              {t("welcomeTo")} {displayName} - {t("yourPremierBettingDestination")}
            </h2>
            <p className="mb-4" style={{ color: colors.textMuted }}>
              {t("welcomeDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <>
                  <Link href="/p/dashboard/wallet">
                    <BrandedButton variant="primary" size="lg">
                      {t("depositAndPlay")}
                    </BrandedButton>
                  </Link>
                  <Link href="/casino">
                    <BrandedButton variant="accent" size="lg">
                      {t("exploreCasino")}
                    </BrandedButton>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <BrandedButton variant="primary" size="lg">
                      {t("joinNowAndGetBonus")}
                    </BrandedButton>
                  </Link>
                  <Link href="/casino">
                    <BrandedButton variant="accent" size="lg">
                      {t("exploreCasino")}
                    </BrandedButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MODERN THEME - Clean minimalist with full-width hero and floating cards
  if (theme === "modern") {
    return (
      <div className="mb-12">
        {/* Premium hero with layered gradient background */}
        <div className="relative rounded-[2.5rem] overflow-hidden mb-10">
          {/* Multi-layer animated background */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgDark} 100%)
              `,
            }}
          />

          {/* Decorative gradient mesh */}
          <div className="absolute inset-0">
            <div
              className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
              style={{ background: `radial-gradient(circle, ${colors.accent}60, transparent 70%)` }}
            />
            <div
              className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-25 blur-[80px]"
              style={{ background: `radial-gradient(circle, ${colors.accent}50, transparent 70%)` }}
            />
            <div
              className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full opacity-20 blur-[60px]"
              style={{ background: colors.accent }}
            />
          </div>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${colors.text} 1px, transparent 1px), linear-gradient(90deg, ${colors.text} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 lg:py-28">
            <div className="max-w-5xl mx-auto">
              {/* Top section with badge and mini stats */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                {/* Animated badge */}
                <div
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full self-start"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
                    border: `1px solid ${colors.accent}25`,
                    boxShadow: `0 0 30px ${colors.accent}15`,
                  }}
                >
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: colors.accent }} />
                    <div
                      className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-40"
                      style={{ background: colors.accent }}
                    />
                  </div>
                  <span className="text-sm font-bold tracking-wide uppercase" style={{ color: colors.accent }}>
                    100% Welcome Bonus Up To $500
                  </span>
                </div>

                {/* Mini floating stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: `${colors.text}08` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
                      2,847 online now
                    </span>
                  </div>
                </div>
              </div>

              {/* Main heading with animated gradient */}
              <div className="text-center mb-10">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
                  <span style={{ color: colors.text }}>Welcome to </span>
                  <span
                    className="relative inline-block"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}90, ${colors.accent})`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {displayName}
                    {/* Underline decoration */}
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-3"
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,8 Q50,0 100,8 T200,8"
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    </svg>
                  </span>
                </h1>
                <p
                  className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed font-light"
                  style={{ color: colors.textMuted }}
                >
                  The ultimate destination for sports betting and casino gaming.
                  <span className="hidden md:inline">
                    {" "}
                    Experience premium odds, instant payouts, and world-class entertainment.
                  </span>
                </p>
              </div>

              {/* CTA Section with visual treatment */}
              <div className="flex flex-col items-center gap-8 mb-14">
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {isAuthenticated ? (
                    <>
                      <Link href="/p/dashboard/wallet">
                        <button
                          className="group relative px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
                            color: colors.accentForeground,
                            boxShadow: `0 20px 40px ${colors.accent}30, 0 0 0 1px ${colors.accent}`,
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            <Sparkles className="w-5 h-5" />
                            Deposit & Play
                            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </button>
                      </Link>
                      <Link href="/casino">
                        <button
                          className="px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
                          style={{
                            background: `${colors.accent}08`,
                            border: `2px solid ${colors.accent}30`,
                            color: colors.accent,
                          }}
                        >
                          Explore Casino
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/auth">
                        <button
                          className="group relative px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
                            color: colors.accentForeground,
                            boxShadow: `0 20px 40px ${colors.accent}30, 0 0 0 1px ${colors.accent}`,
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            <Zap className="w-5 h-5" />
                            Get Started Free
                            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </button>
                      </Link>
                      <Link href="/casino">
                        <button
                          className="px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
                          style={{
                            background: `${colors.accent}08`,
                            border: `2px solid ${colors.accent}30`,
                            color: colors.accent,
                          }}
                        >
                          Browse Games
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                {/* Trust badges */}
                <div
                  className="flex flex-wrap items-center justify-center gap-6 text-sm"
                  style={{ color: colors.textMuted }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: colors.accent }} />
                    <span>Licensed & Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: colors.accent }} />
                    <span>Instant Withdrawals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: colors.accent }} />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Stats row with premium cards */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div
                  className="relative text-center p-6 rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgCard}80)`,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(135deg, ${colors.accent}10, transparent)` }}
                  />
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: colors.accent }}>
                      $24M+
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      Paid This Month
                    </div>
                  </div>
                </div>
                <div
                  className="relative text-center p-6 rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgCard}80)`,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(135deg, ${colors.accent}10, transparent)` }}
                  />
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: colors.accent }}>
                      50K+
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      Active Users
                    </div>
                  </div>
                </div>
                <div
                  className="relative text-center p-6 rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgCard}80)`,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(135deg, ${colors.accent}10, transparent)` }}
                  />
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: colors.accent }}>
                      99.9%
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>
                      Uptime
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium feature cards - Bento grid style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sports Betting Card */}
          <Link href="/sports" className="group">
            <div
              className="relative h-full p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${colors.bgCard}, ${colors.bgDark})`,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 10px 40px ${colors.bgDark}60`,
              }}
            >
              {/* Accent gradient on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle at top left, ${colors.accent}15, transparent 60%)`,
                }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-8 right-8 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
              />

              <div className="relative z-10">
                {/* Icon with glow */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
                    boxShadow: `0 10px 30px ${colors.accent}20`,
                  }}
                >
                  <Trophy className="w-8 h-8" style={{ color: colors.accent }} />
                </div>

                <h3 className="text-2xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.text }}>
                  Sports Betting
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: colors.textMuted }}>
                  Live odds on 50+ sports with the best prices guaranteed. Bet on football, basketball, tennis and more.
                </p>

                {/* CTA with arrow animation */}
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold transition-all duration-300 group-hover:mr-2"
                    style={{ color: colors.accent }}
                  >
                    Explore Sports
                  </span>
                  <ArrowRight
                    className="w-5 h-5 transition-all duration-300 group-hover:translate-x-2"
                    style={{ color: colors.accent }}
                  />
                </div>
              </div>
            </div>
          </Link>

          {/* Casino Card - Featured/Larger feel */}
          <Link href="/casino" className="group">
            <div
              className="relative h-full p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${colors.accent}15, ${colors.bgDark})`,
                border: `1px solid ${colors.accent}30`,
                boxShadow: `0 10px 40px ${colors.accent}15`,
              }}
            >
              {/* Special shimmer effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle at top right, ${colors.accent}25, transparent 60%)`,
                }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-8 right-8 h-1 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}20)`,
                      boxShadow: `0 10px 30px ${colors.accent}30`,
                    }}
                  >
                    <Star className="w-8 h-8" style={{ color: colors.accent }} />
                  </div>
                  {/* Hot badge */}
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: colors.accent,
                      color: colors.accentForeground,
                    }}
                  >
                    POPULAR
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.text }}>
                  Casino Games
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: colors.textMuted }}>
                  500+ slots, live dealers, and table games with massive jackpots. Win big today!
                </p>

                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold transition-all duration-300 group-hover:mr-2"
                    style={{ color: colors.accent }}
                  >
                    Play Now
                  </span>
                  <ArrowRight
                    className="w-5 h-5 transition-all duration-300 group-hover:translate-x-2"
                    style={{ color: colors.accent }}
                  />
                </div>
              </div>
            </div>
          </Link>

          {/* Live Betting Card */}
          <Link href="/in-play" className="group">
            <div
              className="relative h-full p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${colors.bgCard}, ${colors.bgDark})`,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 10px 40px ${colors.bgDark}60`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle at bottom right, ${colors.accent}15, transparent 60%)`,
                }}
              />

              <div
                className="absolute top-0 left-8 right-8 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
                      boxShadow: `0 10px 30px ${colors.accent}20`,
                    }}
                  >
                    <TrendingUp className="w-8 h-8" style={{ color: colors.accent }} />
                  </div>
                  {/* Live indicator */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
                    </div>
                    <span className="text-xs font-bold text-red-500">LIVE</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.text }}>
                  Live Betting
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: colors.textMuted }}>
                  Real-time odds that update every second on live matches. Bet as the action unfolds.
                </p>

                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold transition-all duration-300 group-hover:mr-2"
                    style={{ color: colors.accent }}
                  >
                    Bet Live
                  </span>
                  <ArrowRight
                    className="w-5 h-5 transition-all duration-300 group-hover:translate-x-2"
                    style={{ color: colors.accent }}
                  />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  // NEON THEME - Cyberpunk with glassmorphism, neon borders, and animated elements
  if (theme === "neon") {
    return (
      <div className="mb-8">
        {/* Neon hero with glowing effects */}
        <div
          className="relative rounded-2xl overflow-hidden mb-6 border"
          style={{
            background: `linear-gradient(135deg, ${colors.bgDark}f0, ${colors.bgCard}f0)`,
            borderColor: colors.accent,
            boxShadow: `0 0 30px ${colors.accent}40, inset 0 0 60px ${colors.accent}10`,
          }}
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${colors.accent}20 1px, transparent 1px), linear-gradient(90deg, ${colors.accent}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Glowing orbs */}
          <div
            className="absolute top-10 right-10 w-32 h-32 rounded-full blur-3xl animate-pulse"
            style={{ background: colors.accent, opacity: 0.3 }}
          />
          <div
            className="absolute bottom-10 left-10 w-24 h-24 rounded-full blur-2xl animate-pulse"
            style={{ background: colors.accent, opacity: 0.2, animationDelay: "1s" }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Left content */}
              <div className="flex-1 text-center md:text-left">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border animate-pulse"
                  style={{
                    background: `${colors.accent}10`,
                    borderColor: colors.accent,
                    boxShadow: `0 0 15px ${colors.accent}50`,
                  }}
                >
                  <Zap className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-sm font-bold tracking-wider" style={{ color: colors.accent }}>
                    LIVE NOW
                  </span>
                </div>

                <h1
                  className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
                  style={{
                    color: colors.text,
                    textShadow: `0 0 40px ${colors.accent}60`,
                  }}
                >
                  {displayName}
                </h1>

                <p className="text-lg mb-8 max-w-xl" style={{ color: colors.textMuted }}>
                  Experience the thrill of next-gen betting with real-time odds and instant payouts
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {isAuthenticated ? (
                    <>
                      <Link href="/p/dashboard/wallet">
                        <button
                          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 border-2"
                          style={{
                            background: `${colors.accent}20`,
                            borderColor: colors.accent,
                            color: colors.accent,
                            boxShadow: `0 0 20px ${colors.accent}40`,
                          }}
                        >
                          <Flame className="w-5 h-5 inline mr-2" />
                          DEPOSIT NOW
                        </button>
                      </Link>
                      <Link href="/casino">
                        <button
                          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                          style={{
                            background: colors.accent,
                            color: colors.accentForeground,
                            boxShadow: `0 0 30px ${colors.accent}60`,
                          }}
                        >
                          PLAY CASINO
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/auth">
                        <button
                          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
                          style={{
                            background: colors.accent,
                            color: colors.accentForeground,
                            boxShadow: `0 0 30px ${colors.accent}60`,
                          }}
                        >
                          <Zap className="w-5 h-5 inline mr-2" />
                          JOIN THE ACTION
                        </button>
                      </Link>
                      <Link href="/casino">
                        <button
                          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 border-2"
                          style={{
                            background: "transparent",
                            borderColor: colors.accent,
                            color: colors.accent,
                            boxShadow: `0 0 20px ${colors.accent}40`,
                          }}
                        >
                          EXPLORE GAMES
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Right side - Stats cards with glassmorphism */}
              <div className="hidden md:flex flex-col gap-4 w-64">
                <div
                  className="p-4 rounded-xl backdrop-blur-xl border"
                  style={{
                    background: `${colors.bgCard}80`,
                    borderColor: `${colors.accent}50`,
                    boxShadow: `0 0 20px ${colors.accent}20`,
                  }}
                >
                  <div className="text-3xl font-black mb-1" style={{ color: colors.accent }}>
                    $2.4M+
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Paid out today
                  </div>
                </div>
                <div
                  className="p-4 rounded-xl backdrop-blur-xl border"
                  style={{
                    background: `${colors.bgCard}80`,
                    borderColor: `${colors.accent}50`,
                    boxShadow: `0 0 20px ${colors.accent}20`,
                  }}
                >
                  <div className="text-3xl font-black mb-1" style={{ color: colors.accent }}>
                    1,247
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Live matches
                  </div>
                </div>
                <div
                  className="p-4 rounded-xl backdrop-blur-xl border"
                  style={{
                    background: `${colors.bgCard}80`,
                    borderColor: `${colors.accent}50`,
                    boxShadow: `0 0 20px ${colors.accent}20`,
                  }}
                >
                  <div className="text-3xl font-black mb-1" style={{ color: colors.accent }}>
                    50K+
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    Active players
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Neon feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/sports" className="group">
            <div
              className="relative p-6 rounded-xl overflow-hidden transition-all hover:scale-[1.02] border"
              style={{
                background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
                borderColor: `${colors.accent}50`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `inset 0 0 40px ${colors.accent}30` }}
              />
              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center border"
                  style={{
                    background: `${colors.accent}20`,
                    borderColor: colors.accent,
                    boxShadow: `0 0 15px ${colors.accent}40`,
                  }}
                >
                  <Trophy className="w-8 h-8" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
                    Sports Betting
                  </h3>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Best odds guaranteed
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/casino" className="group">
            <div
              className="relative p-6 rounded-xl overflow-hidden transition-all hover:scale-[1.02] border"
              style={{
                background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
                borderColor: `${colors.accent}50`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `inset 0 0 40px ${colors.accent}30` }}
              />
              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center border"
                  style={{
                    background: `${colors.accent}20`,
                    borderColor: colors.accent,
                    boxShadow: `0 0 15px ${colors.accent}40`,
                  }}
                >
                  <Star className="w-8 h-8" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
                    Casino Games
                  </h3>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    500+ premium slots
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  // Default fallback to classic
  return null
}

// =
// SPORTS GRID - Different layouts per theme
// =
export function ThemedSportsGrid({
  sports,
  loadingSports,
  activeSportFilter,
  handleSportClick,
  getSportEmoji,
  t,
  colors,
}) {
  const theme = useCurrentTheme()

  // CLASSIC - Horizontal scroll with square cards
  if (theme === "classic") {
    return (
      <div className="mb-6 md:mb-8">
        <div
          className="backdrop-blur-sm border rounded-xl p-4 md:p-6 shadow-xl"
          style={{ backgroundColor: `${colors.bgCard}cc`, borderColor: colors.border }}
        >
          <h3 className="font-semibold mb-4 text-sm md:text-base" style={{ color: colors.accent }}>
            {t("sports")}
          </h3>
          <div className="flex justify-center overflow-x-auto gap-3 md:gap-4 py-4 scrollbar-hide">
            {loadingSports ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <div
                    className="rounded-xl p-3 md:p-4 animate-pulse w-24 h-32"
                    style={{ backgroundColor: `${colors.bgMuted}80` }}
                  />
                </div>
              ))
            ) : sports.length > 0 ? (
              sports.map((sport) => {
                const isActive = activeSportFilter === sport._id
                return (
                  <button
                    key={sport._id}
                    onClick={() => handleSportClick(sport._id)}
                    className={`flex-shrink-0 flex flex-col items-center transition-all duration-300 ${
                      isActive ? "scale-110" : "hover:scale-105"
                    }`}
                  >
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 p-3 md:p-4 shadow-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? `${colors.accent}33` : colors.bgMuted,
                        borderColor: isActive ? colors.accent : colors.border,
                        boxShadow: isActive ? `0 0 20px ${colors.accent}80` : "none",
                      }}
                    >
                      {sport.iconUrl ? (
                        <Image
                          src={sport.iconUrl || "/placeholder.svg"}
                          alt={sport.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-3xl">{getSportEmoji(sport.name)}</span>
                      )}
                    </div>
                    <span
                      className="text-xs md:text-sm mt-2 font-medium"
                      style={{ color: isActive ? colors.accent : colors.textMuted }}
                    >
                      {sport.name}
                    </span>
                  </button>
                )
              })
            ) : (
              <p style={{ color: colors.textMuted }}>{t("noSportsAvailable")}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // MODERN - Pill-shaped horizontal tabs
  if (theme === "modern") {
    return (
      <div className="mb-10">
        {/* Section header with accent line */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 rounded-full" style={{ background: colors.accent }} />
            <div>
              <h3 className="text-xl font-bold" style={{ color: colors.text }}>
                Browse Sports
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Choose your favorite sport to bet on
              </p>
            </div>
          </div>
          <Link
            href="/sports"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: `${colors.accent}10`,
              color: colors.accent,
            }}
          >
            View All
          </Link>
        </div>

        {/* Sports carousel with gradient fade */}
        <div className="relative">
          {/* Left fade */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${colors.bgDark}, transparent)` }}
          />
          {/* Right fade */}
          <div
            className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${colors.bgDark}, transparent)` }}
          />

          <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
            {loadingSports ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-32 h-36 rounded-2xl animate-pulse"
                  style={{ backgroundColor: colors.bgMuted }}
                />
              ))
            ) : sports.length > 0 ? (
              sports.map((sport) => {
                const isActive = activeSportFilter === sport._id
                return (
                  <button key={sport._id} onClick={() => handleSportClick(sport._id)} className="flex-shrink-0 group">
                    <div
                      className="relative w-32 h-36 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 overflow-hidden"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${colors.accent}, ${colors.accent}cc)`
                          : `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
                        border: `1px solid ${isActive ? colors.accent : colors.border}`,
                        boxShadow: isActive ? `0 10px 30px ${colors.accent}40` : `0 4px 15px ${colors.bgDark}40`,
                        transform: isActive ? "translateY(-4px)" : "translateY(0)",
                      }}
                    >
                      {/* Hover overlay */}
                      {!isActive && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `linear-gradient(135deg, ${colors.accent}15, transparent)` }}
                        />
                      )}

                      <div className="relative z-10">
                        {sport.iconUrl ? (
                          <Image
                            src={sport.iconUrl || "/placeholder.svg"}
                            alt={sport.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-4xl transition-transform duration-300 group-hover:scale-110 block">
                            {getSportEmoji(sport.name)}
                          </span>
                        )}
                      </div>
                      <span
                        className="relative z-10 text-sm font-semibold text-center px-2"
                        style={{
                          color: isActive ? colors.accentForeground : colors.text,
                        }}
                      >
                        {sport.name}
                      </span>

                      {/* Active indicator dot */}
                      {isActive && (
                        <div
                          className="absolute bottom-3 w-2 h-2 rounded-full"
                          style={{ background: colors.accentForeground }}
                        />
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <p style={{ color: colors.textMuted }}>{t("noSportsAvailable")}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // NEON - Hexagonal/angular cards with glow
  if (theme === "neon") {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-wide flex items-center gap-2" style={{ color: colors.text }}>
            <Zap className="w-5 h-5" style={{ color: colors.accent }} />
            SPORTS
          </h3>
          <button className="text-sm font-bold tracking-wider" style={{ color: colors.accent }}>
            VIEW ALL →
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {loadingSports ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg animate-pulse"
                style={{ backgroundColor: colors.bgMuted }}
              />
            ))
          ) : sports.length > 0 ? (
            sports.map((sport) => {
              const isActive = activeSportFilter === sport._id
              return (
                <button
                  key={sport._id}
                  onClick={() => handleSportClick(sport._id)}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 border"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${colors.accent}30, ${colors.bgCard})`
                      : colors.bgCard,
                    borderColor: isActive ? colors.accent : `${colors.accent}30`,
                    boxShadow: isActive ? `0 0 20px ${colors.accent}50` : "none",
                  }}
                >
                  <span className="text-2xl">{getSportEmoji(sport.name)}</span>
                  <span
                    className="text-xs font-medium truncate w-full px-1 text-center"
                    style={{ color: isActive ? colors.accent : colors.textMuted }}
                  >
                    {sport.name}
                  </span>
                </button>
              )
            })
          ) : (
            <p style={{ color: colors.textMuted }}>{t("noSportsAvailable")}</p>
          )}
        </div>
      </div>
    )
  }

  return null
}

// =
// MATCH CARD - Different styles per theme
// =
export function ThemedMatchCard({ match, onBetNow, onViewDetails, t, colors }) {
  const theme = useCurrentTheme()

  const homeTeam = match.homeTeam?.name || match.homeTeam || "TBD"
  const awayTeam = match.awayTeam?.name || match.awayTeam || "TBD"
  const boostedOdds = match.odds?.home || "0.00"
  const originalOdds = (Number.parseFloat(boostedOdds) * 0.85).toFixed(2)

  // CLASSIC - Traditional card with badge
  if (theme === "classic") {
    return (
      <div
        className="backdrop-blur-sm border rounded-xl p-4 hover:border-opacity-50 transition-all duration-300 flex flex-col"
        style={{
          backgroundColor: `${colors.bgCard}80`,
          borderColor: colors.border,
        }}
      >
        {match.isFeatured && (
          <div className="mb-3">
            <span
              className="text-xs px-3 py-1 rounded font-bold uppercase"
              style={{ backgroundColor: colors.accent, color: colors.accentForeground }}
            >
              BET BOOST
            </span>
            <span className="text-xs ml-2" style={{ color: colors.accent }}>
              {Math.floor(Math.random() * 1000) + 100} placed
            </span>
          </div>
        )}

        <h3 className="font-bold text-sm mb-3" style={{ color: colors.text }}>
          {homeTeam} V {awayTeam}
        </h3>

        <div className="space-y-1 mb-3 flex-1">
          <div className="text-xs" style={{ color: colors.textMuted }}>
            • {homeTeam} to Win
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            • Both Teams to Score
          </div>
        </div>

        <button
          onClick={() => onViewDetails(match)}
          className="text-xs mb-3 text-left"
          style={{ color: colors.accent }}
        >
          {t("viewDetails")} →
        </button>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="line-through text-lg" style={{ color: colors.textMuted }}>
            {originalOdds}
          </span>
          <span className="font-bold text-2xl" style={{ color: colors.text }}>
            {boostedOdds}
          </span>
        </div>

        <div className="text-xs text-center mb-4" style={{ color: colors.textMuted }}>
          $10 stake returns ${(Number.parseFloat(boostedOdds) * 10).toFixed(0)}
        </div>

        <button
          onClick={() => onBetNow(match)}
          className="w-full font-bold py-3 rounded-lg transition-all hover:scale-105"
          style={{ backgroundColor: colors.accent, color: colors.accentForeground }}
        >
          {t("betNow")}
        </button>
      </div>
    )
  }

  // MODERN - Clean minimal card with subtle shadow
  if (theme === "modern") {
    return (
      <div
        className="group relative rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 4px 20px ${colors.bgDark}30`,
        }}
      >
        {/* Hover gradient effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${colors.accent}08, transparent)` }}
        />

        {/* Accent line at top */}
        <div
          className="absolute top-0 left-6 right-6 h-1 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
        />

        <div className="relative z-10">
          {/* Header with badge and date */}
          <div className="flex items-center justify-between mb-5">
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}20, ${colors.accent}10)`,
                color: colors.accent,
              }}
            >
              <Flame className="w-3 h-3" />
              Boosted
            </span>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
              {match.startTime
                ? new Date(match.startTime).toLocaleDateString("en", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Coming Soon"}
            </span>
          </div>

          {/* Teams */}
          <h3 className="text-lg font-bold mb-6 leading-snug" style={{ color: colors.text }}>
            {homeTeam} <span style={{ color: colors.textMuted }}>vs</span> {awayTeam}
          </h3>

          {/* Odds display */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: `${colors.accent}08`, border: `1px solid ${colors.accent}15` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Boosted Odds
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: colors.accent }}>
                    {boostedOdds}
                  </span>
                  <span className="text-sm line-through" style={{ color: colors.textMuted }}>
                    {originalOdds}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  $10 Returns
                </div>
                <div className="text-2xl font-bold" style={{ color: colors.text }}>
                  ${(Number.parseFloat(boostedOdds) * 10).toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onBetNow(match)}
            className="w-full font-semibold py-3.5 rounded-xl transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.accent,
              color: colors.accentForeground,
              boxShadow: `0 4px 15px ${colors.accent}30`,
            }}
          >
            <span>Place Bet</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    )
  }

  // NEON - Cyberpunk card with glowing borders
  if (theme === "neon") {
    return (
      <div
        className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] border relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
          borderColor: `${colors.accent}50`,
        }}
      >
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `inset 0 0 30px ${colors.accent}20` }}
        />

        <div className="relative z-10">
          {match.isFeatured && (
            <div className="mb-3">
              <span
                className="text-xs px-3 py-1 rounded font-bold tracking-wider border"
                style={{
                  backgroundColor: `${colors.accent}20`,
                  borderColor: colors.accent,
                  color: colors.accent,
                  boxShadow: `0 0 10px ${colors.accent}50`,
                }}
              >
                ⚡ BOOSTED
              </span>
            </div>
          )}

          <h3 className="font-bold text-sm mb-3 tracking-wide" style={{ color: colors.text }}>
            {homeTeam} VS {awayTeam}
          </h3>

          <div
            className="flex items-center justify-between mb-4 py-3 px-4 rounded-lg"
            style={{ backgroundColor: `${colors.bgDark}80` }}
          >
            <div>
              <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                ODDS
              </div>
              <div
                className="text-2xl font-black"
                style={{ color: colors.accent, textShadow: `0 0 10px ${colors.accent}` }}
              >
                {boostedOdds}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                POTENTIAL WIN
              </div>
              <div className="text-xl font-bold" style={{ color: colors.text }}>
                ${(Number.parseFloat(boostedOdds) * 10).toFixed(0)}
              </div>
            </div>
          </div>

          <button
            onClick={() => onBetNow(match)}
            className="w-full font-bold py-3 rounded-lg transition-all hover:scale-105 border tracking-wider"
            style={{
              backgroundColor: `${colors.accent}20`,
              borderColor: colors.accent,
              color: colors.accent,
              boxShadow: `0 0 15px ${colors.accent}40`,
            }}
          >
            BET NOW →
          </button>
        </div>
      </div>
    )
  }

  return null
}

// =
// LIVE MATCH ROW - Different styles per theme
// =
export function ThemedLiveMatchRow({ match, onAddToBetslip, colors }) {
  const theme = useCurrentTheme()

  // CLASSIC - Traditional row layout
  if (theme === "classic") {
    return (
      <div
        className="backdrop-blur-sm border rounded-xl p-4 hover:border-opacity-50 transition-all duration-300"
        style={{
          backgroundColor: `${colors.bgCard}80`,
          borderColor: colors.border,
        }}
      >
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-2 md:col-span-1 text-center">
            <div className="text-xs" style={{ color: colors.textMuted }}>
              {match.time}
            </div>
            <div className="text-xs text-red-500 flex justify-center mt-1">
              <MonitorDot className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          <div className="col-span-5 md:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm truncate" style={{ color: colors.text }}>
                {match.team1}
              </span>
              <span className="text-sm font-bold ml-2" style={{ color: colors.accent }}>
                {match.score1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate" style={{ color: colors.text }}>
                {match.team2}
              </span>
              <span className="text-sm font-bold ml-2" style={{ color: colors.accent }}>
                {match.score2}
              </span>
            </div>
          </div>

          <div className="col-span-5 md:col-span-7 grid grid-cols-3 gap-2">
            {match.odds.map((odd, index) => (
              <button
                key={index}
                onClick={() => onAddToBetslip(match, index === 0 ? "1" : index === 1 ? "X" : "2", odd)}
                className="border-2 rounded-lg p-2 md:p-3 text-center transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: colors.bgMuted,
                  borderColor: colors.border,
                }}
              >
                <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                  {index === 0 ? "1" : index === 1 ? "X" : "2"}
                </div>
                <div className="text-base md:text-lg font-bold" style={{ color: colors.text }}>
                  {odd}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // MODERN - Clean horizontal card
  if (theme === "modern") {
    return (
      <div
        className="group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 2px 15px ${colors.bgDark}20`,
        }}
      >
        {/* Hover effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(135deg, ${colors.accent}05, transparent)` }}
        />

        <div className="relative z-10 flex items-center gap-5">
          {/* Live indicator with pulse */}
          <div className="flex flex-col items-center min-w-[60px]">
            <div className="relative">
              <span className="w-3 h-3 rounded-full block" style={{ background: "#ef4444" }} />
              <span
                className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                style={{ background: "#ef4444", opacity: 0.4 }}
              />
            </div>
            <span className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              {match.time}
            </span>
          </div>

          {/* Teams and scores */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold" style={{ color: colors.text }}>
                {match.team1}
              </span>
              <span
                className="text-xl font-bold px-3 py-1 rounded-lg"
                style={{
                  background: `${colors.accent}15`,
                  color: colors.accent,
                }}
              >
                {match.score1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: colors.text }}>
                {match.team2}
              </span>
              <span
                className="text-xl font-bold px-3 py-1 rounded-lg"
                style={{
                  background: `${colors.accent}15`,
                  color: colors.accent,
                }}
              >
                {match.score2}
              </span>
            </div>
          </div>

          {/* Odds buttons */}
          <div className="flex gap-2">
            {match.odds.map((odd, index) => (
              <button
                key={index}
                onClick={() => onAddToBetslip(match, index === 0 ? "1" : index === 1 ? "X" : "2", odd)}
                className="group/btn relative min-w-[70px] py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDark})`,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {/* Button hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${colors.accent}20, ${colors.accent}05)` }}
                />

                <div className="relative z-10">
                  <div className="text-xs font-semibold mb-1" style={{ color: colors.textMuted }}>
                    {index === 0 ? "1" : index === 1 ? "X" : "2"}
                  </div>
                  <div className="text-lg font-bold" style={{ color: colors.text }}>
                    {odd}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // NEON - Cyberpunk style with glow
  if (theme === "neon") {
    return (
      <div
        className="rounded-xl p-4 transition-all duration-300 border"
        style={{
          background: `linear-gradient(90deg, ${colors.bgCard}, ${colors.bgDark})`,
          borderColor: `${colors.accent}30`,
        }}
      >
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div
            className="flex flex-col items-center px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: `${colors.accent}10`,
              borderColor: `${colors.accent}50`,
            }}
          >
            <MonitorDot className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs mt-1 font-mono" style={{ color: colors.accent }}>
              {match.time}
            </span>
          </div>

          {/* Teams */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium tracking-wide" style={{ color: colors.text }}>
                {match.team1}
              </span>
              <span
                className="font-bold text-xl font-mono"
                style={{ color: colors.accent, textShadow: `0 0 8px ${colors.accent}` }}
              >
                {match.score1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium tracking-wide" style={{ color: colors.text }}>
                {match.team2}
              </span>
              <span
                className="font-bold text-xl font-mono"
                style={{ color: colors.accent, textShadow: `0 0 8px ${colors.accent}` }}
              >
                {match.score2}
              </span>
            </div>
          </div>

          {/* Odds */}
          <div className="flex gap-2">
            {match.odds.map((odd, index) => (
              <button
                key={index}
                onClick={() => onAddToBetslip(match, index === 0 ? "1" : index === 1 ? "X" : "2", odd)}
                className="px-4 py-2 rounded-lg transition-all hover:scale-105 border"
                style={{
                  backgroundColor: `${colors.bgDark}`,
                  borderColor: `${colors.accent}50`,
                }}
              >
                <div className="text-xs font-bold" style={{ color: colors.textMuted }}>
                  {index === 0 ? "1" : index === 1 ? "X" : "2"}
                </div>
                <div className="font-bold font-mono" style={{ color: colors.accent }}>
                  {odd}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// =
// SECTION HEADER - Different styles per theme
// =
export function ThemedSectionHeader({ title, icon: Icon, viewAllHref, viewAllText = "View All", colors }) {
  const theme = useCurrentTheme()

  if (theme === "classic") {
    return (
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          {Icon && <Icon className="w-5 h-5" style={{ color: colors.accent }} />}
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text }}>
            {title}
          </h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm md:text-base font-medium" style={{ color: colors.accent }}>
            {viewAllText}
          </Link>
        )}
      </div>
    )
  }

  if (theme === "modern") {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{
              backgroundColor: `${colors.accent}10`,
              color: colors.accent,
            }}
          >
            {viewAllText} →
          </Link>
        )}
      </div>
    )
  }

  if (theme === "neon") {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-wider flex items-center gap-2" style={{ color: colors.text }}>
          {Icon && <Icon className="w-5 h-5" style={{ color: colors.accent }} />}
          {title.toUpperCase()}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-bold tracking-wider border px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              borderColor: colors.accent,
              color: colors.accent,
              boxShadow: `0 0 10px ${colors.accent}30`,
            }}
          >
            {viewAllText.toUpperCase()} →
          </Link>
        )}
      </div>
    )
  }

  return null
}
