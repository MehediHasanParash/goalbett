"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useTenant } from "@/components/providers/tenant-provider"
import { MonitorDot, LandPlot, Loader2, Zap, Activity, Radio, TrendingUp, Timer, Flame } from "lucide-react"
import Link from "next/link"
import { useLiveEvents } from "@/hooks/useEvents"
import { useSports } from "@/hooks/useSports"
import { useBetState } from "@/lib/bet-state"
import { useLanguage } from "@/lib/i18n/language-context"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useThemeColors } from "@/hooks/useThemeColors"

const SPORT_ICONS = {
  soccer: "/sports/soccer.png",
  football: "/sports/soccer.png",
  basketball: "/sports/basketball.png",
  cricket: "/sports/cricket.png",
  tennis: "/sports/tennis.png",
  boxing: "/sports/boxing.png",
  golf: "/sports/golf.png",
  "formula-1": "/sports/formula1.png",
  formula1: "/sports/formula1.png",
  esports: "/sports/esports.png",
  horses: "/sports/horse.png",
  "horse-racing": "/sports/horse.png",
  casino: "/sports/casino.png",
  virtual: "/sports/virtual.png",
  futsal: "/sports/futsal.png",
}

const getSportIcon = (sport) => {
  if (!sport) return null
  if (sport.slug && SPORT_ICONS[sport.slug]) {
    return SPORT_ICONS[sport.slug]
  }
  if (sport.icon && sport.icon.startsWith("/")) {
    return sport.icon
  }
  return null
}

export function InPlayContent() {
  const { brandName, tenant } = useTenant()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sportFromUrl = searchParams.get("sport")
  const [activeFilter, setActiveFilter] = useState(sportFromUrl || "all")
  const { t, locale } = useLanguage()
  const { isAuthenticated } = useAuth()
  const { colors, currentTheme } = useThemeColors()

  useEffect(() => {
    if (sportFromUrl) {
      setActiveFilter(sportFromUrl)
    }
  }, [sportFromUrl])

  const {
    liveEvents,
    count: liveCount,
    isLoading: eventsLoading,
  } = useLiveEvents(activeFilter !== "all" ? activeFilter : null)
  const { sports: apiSports, isLoading: sportsLoading } = useSports()
  const { addBet } = useBetState()

  const sports = [
    { id: "all", name: t("allSports"), icon: null, isLucide: true, count: liveCount },
    ...(apiSports || []).map((sport) => ({
      id: sport.slug,
      name: sport.name,
      icon: getSportIcon(sport),
      isLucide: false,
      count: sport.liveCount || 0,
    })),
  ]

  const getTeamName = (team) => {
    if (!team) return "TBD"
    if (typeof team === "string") return team
    if (typeof team === "object" && team.name) return team.name
    return "TBD"
  }

  const getTeamScore = (team, fallback = 0) => {
    if (team === null || team === undefined) return fallback
    if (typeof team === "number") return team
    if (typeof team === "object" && team.score !== undefined) return team.score ?? fallback
    return fallback
  }

  const handleAddBet = (event, oddIndex, oddValue) => {
    if (!event) return

    const betTypes = ["Home", "Draw", "Away"]
    const homeTeamName = getTeamName(event.homeTeam)
    const awayTeamName = getTeamName(event.awayTeam)
    const eventName = `${homeTeamName} vs ${awayTeamName}`
    const selection = betTypes[oddIndex]
    const odds = Number.parseFloat(oddValue)

    if (isNaN(odds) || oddValue === "-") {
      toast.error("Invalid odds")
      return
    }

    addBet({
      eventId: event._id || event.id,
      eventName: eventName,
      selection: selection,
      odds: odds,
      league: event.league?.name || event.competition || t("unknownLeague"),
      isLive: true,
    })

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("addToBetslip", {
          detail: {
            eventId: event._id || event.id,
            eventName: eventName,
            market: "Match Winner",
            selection: selection,
            odds: odds,
            isLive: true,
          },
        }),
      )
    }

    toast.success(`Added ${selection} @ ${odds.toFixed(2)} to betslip`)
  }

  if (eventsLoading || sportsLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent }} />
          <span className="ml-2" style={{ color: colors.textMuted }}>
            {t("loadingLiveEvents")}
          </span>
        </div>
      </div>
    )
  }

  const liveMatches = (liveEvents || []).map((event) => {
    const odds1X2 = event.odds?.["1X2"] || event.odds?.["Match Winner"] || {}
    return {
      id: event._id || event.id,
      team1: getTeamName(event.homeTeam),
      team2: getTeamName(event.awayTeam),
      score1: getTeamScore(event.homeTeam, event.score?.home ?? 0),
      score2: getTeamScore(event.awayTeam, event.score?.away ?? 0),
      odds: [odds1X2.home?.toFixed(2) || "-", odds1X2.draw?.toFixed(2) || "-", odds1X2.away?.toFixed(2) || "-"],
      time: event.liveInfo?.minute ? `${event.liveInfo.minute}'` : event.matchTime || "LIVE",
      league: event.league?.name || event.competition || t("unknownLeague"),
      sportSlug: event.sport?.slug || "soccer",
      originalEvent: event,
    }
  })

  if (currentTheme === "modern") {
    return (
      <ModernInPlay
        liveMatches={liveMatches}
        sports={sports}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        handleAddBet={handleAddBet}
        colors={colors}
        t={t}
      />
    )
  }

  if (currentTheme === "neon") {
    return (
      <NeonInPlay
        liveMatches={liveMatches}
        sports={sports}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        handleAddBet={handleAddBet}
        colors={colors}
        t={t}
      />
    )
  }

  // Classic Theme (default)
  return (
    <ClassicInPlay
      liveMatches={liveMatches}
      sports={sports}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      handleAddBet={handleAddBet}
      colors={colors}
      t={t}
    />
  )
}

function ClassicInPlay({ liveMatches, sports, activeFilter, setActiveFilter, handleAddBet, colors, t }) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* Live Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-lg font-bold" style={{ color: colors.accent }}>
            {t("liveNow")}
          </span>
        </div>
        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
          {liveMatches.length} {t("events")}
        </Badge>
      </div>

      {/* Sports Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveFilter(sport.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === sport.id ? "text-black" : "border text-white hover:opacity-80"
            }`}
            style={{
              backgroundColor: activeFilter === sport.id ? colors.accent : colors.bgMuted,
              borderColor: activeFilter === sport.id ? colors.accent : colors.border,
            }}
          >
            {sport.isLucide ? (
              <LandPlot className="w-4 h-4" />
            ) : sport.icon ? (
              <Image
                src={sport.icon || "/placeholder.svg"}
                alt={sport.name}
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
            ) : (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                {sport.name.charAt(0)}
              </span>
            )}
            {sport.name}
            <Badge variant="secondary" className="ml-1 text-xs">
              {sport.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Live Matches */}
      {liveMatches.length === 0 ? (
        <div className="text-center py-12">
          <MonitorDot className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textMuted }} />
          <p className="text-lg font-medium" style={{ color: colors.textMuted }}>
            {t("noLiveEvents")}
          </p>
          <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
            {t("checkBackSoon")}
          </p>
          <Link href="/sports" className="inline-block mt-4 transition-colors" style={{ color: colors.accent }}>
            Browse upcoming matches →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {liveMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-lg p-4 transition-all hover:scale-[1.01]"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                    <MonitorDot className="w-3 h-3 mr-1" />
                    {t("live")}
                  </Badge>
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    {match.league}
                  </span>
                </div>
                <span className="font-mono text-sm" style={{ color: colors.accent }}>
                  {match.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/match/${match.id}`} className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{match.team1}</span>
                    <span className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {match.score1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{match.team2}</span>
                    <span className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {match.score2}
                    </span>
                  </div>
                </Link>

                <div className="flex gap-2 ml-4">
                  {match.odds.map((odd, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleAddBet(match.originalEvent, idx, odd)
                      }}
                      disabled={odd === "-"}
                      className={`px-4 py-3 rounded text-sm font-bold transition-all ${
                        odd === "-" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: colors.bgMuted,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <span className="text-[10px] block mb-0.5" style={{ color: colors.textMuted }}>
                        {idx === 0 ? "1" : idx === 1 ? "X" : "2"}
                      </span>
                      {odd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModernInPlay({ liveMatches, sports, activeFilter, setActiveFilter, handleAddBet, colors, t }) {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Hero Header */}
      <div
        className="relative mb-8 p-8 rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Live Events</h1>
            <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-semibold">{liveMatches.length} Live</Badge>
          </div>
          <p className="text-gray-600 text-lg">Watch and bet on live matches happening right now</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{liveMatches.length}</p>
              <p className="text-sm text-gray-500">Live Matches</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sports.length - 1}</p>
              <p className="text-sm text-gray-500">Sports</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Timer className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">Real-time</p>
              <p className="text-sm text-gray-500">Updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Filter - Pill Style */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Filter by Sport</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveFilter(sport.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeFilter === sport.id
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
              }`}
            >
              {sport.isLucide ? (
                <LandPlot className="w-4 h-4" />
              ) : sport.icon ? (
                <Image
                  src={sport.icon || "/placeholder.svg"}
                  alt={sport.name}
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] object-contain"
                />
              ) : null}
              {sport.name}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${activeFilter === sport.id ? "bg-white/20" : "bg-gray-100"}`}
              >
                {sport.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Matches - Modern Cards */}
      {liveMatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">{t("noLiveEvents")}</p>
          <p className="text-gray-500 mb-6">{t("checkBackSoon")}</p>
          <Link
            href="/sports"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Browse upcoming matches
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {liveMatches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                      <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      LIVE
                    </Badge>
                  </div>
                  <span className="text-gray-500 text-sm font-medium">{match.league}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-violet-600" />
                  <span className="font-mono font-bold text-violet-600">{match.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/match/${match.id}`} className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-lg">{match.team1}</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {match.score1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-lg">{match.team2}</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {match.score2}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 ml-6">
                  {match.odds.map((odd, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleAddBet(match.originalEvent, idx, odd)
                      }}
                      disabled={odd === "-"}
                      className={`px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                        odd === "-"
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-900 hover:border-violet-500 hover:bg-violet-50 group-hover:scale-105"
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 block mb-1 font-medium">
                        {idx === 0 ? "HOME" : idx === 1 ? "DRAW" : "AWAY"}
                      </span>
                      <span className="text-lg">{odd}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NeonInPlay({ liveMatches, sports, activeFilter, setActiveFilter, handleAddBet, colors, t }) {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      {/* Neon Hero */}
      <div
        className="relative mb-8 p-8 rounded-2xl overflow-hidden border border-cyan-500/30"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
              <div className="absolute inset-0 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-50" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight">
              LIVE ARENA
            </h1>
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1.5 text-sm font-bold border-0 shadow-lg shadow-red-500/30">
              <Flame className="w-4 h-4 mr-1" />
              {liveMatches.length} LIVE
            </Badge>
          </div>
          <p className="text-cyan-300/70 text-lg font-mono tracking-wide">// REAL-TIME BETTING :: INSTANT PAYOUTS</p>
        </div>
      </div>

      {/* Neon Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "LIVE", value: liveMatches.length, icon: Activity, color: "cyan" },
          { label: "SPORTS", value: sports.length - 1, icon: Zap, color: "purple" },
          { label: "STATUS", value: "ONLINE", icon: Radio, color: "green" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`relative p-4 rounded-xl border backdrop-blur-sm overflow-hidden`}
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              borderColor:
                stat.color === "cyan"
                  ? "rgba(6, 182, 212, 0.3)"
                  : stat.color === "purple"
                    ? "rgba(168, 85, 247, 0.3)"
                    : "rgba(34, 197, 94, 0.3)",
            }}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color === "cyan" ? "from-cyan-500 to-blue-500" : stat.color === "purple" ? "from-purple-500 to-pink-500" : "from-green-500 to-emerald-500"}`}
            />
            <div className="flex items-center gap-3">
              <stat.icon
                className={`w-6 h-6 ${stat.color === "cyan" ? "text-cyan-400" : stat.color === "purple" ? "text-purple-400" : "text-green-400"}`}
              />
              <div>
                <p
                  className={`text-2xl font-black font-mono ${stat.color === "cyan" ? "text-cyan-400" : stat.color === "purple" ? "text-purple-400" : "text-green-400"}`}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 font-mono tracking-widest">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Neon Sports Filter */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveFilter(sport.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-all duration-300 font-mono tracking-wide ${
                activeFilter === sport.id
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30 skew-x-[-5deg]"
                  : "bg-slate-900/80 border border-cyan-500/20 text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10"
              }`}
              style={{ clipPath: activeFilter === sport.id ? "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)" : undefined }}
            >
              {sport.isLucide ? (
                <LandPlot className="w-4 h-4" />
              ) : sport.icon ? (
                <Image
                  src={sport.icon || "/placeholder.svg"}
                  alt={sport.name}
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] object-contain"
                />
              ) : null}
              {sport.name.toUpperCase()}
              <span
                className={`text-xs px-2 py-0.5 ${activeFilter === sport.id ? "bg-white/20 rounded" : "text-purple-400"}`}
              >
                [{sport.count}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Neon Matches */}
      {liveMatches.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-cyan-500/20 bg-slate-900/50">
          <div className="w-20 h-20 border-2 border-cyan-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Radio className="w-10 h-10 text-cyan-500/50" />
          </div>
          <p className="text-xl font-bold text-cyan-400 mb-2 font-mono">NO_LIVE_EVENTS</p>
          <p className="text-gray-500 font-mono mb-6">// CHECK BACK SOON</p>
          <Link
            href="/sports"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold font-mono hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            BROWSE_MATCHES
            <Zap className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {liveMatches.map((match, matchIdx) => (
            <div
              key={match.id}
              className="relative rounded-xl p-5 border border-cyan-500/20 backdrop-blur-sm overflow-hidden group hover:border-cyan-400/50 transition-all duration-300"
              style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    LIVE
                  </Badge>
                  <span className="text-cyan-400/60 text-sm font-mono">{match.league}</span>
                </div>
                <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/30">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono font-bold text-cyan-400">{match.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/match/${match.id}`} className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-lg">{match.team1}</span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">
                        {match.score1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-lg">{match.team2}</span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">
                        {match.score2}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 ml-6">
                  {match.odds.map((odd, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleAddBet(match.originalEvent, idx, odd)
                      }}
                      disabled={odd === "-"}
                      className={`px-5 py-4 text-sm font-bold transition-all duration-300 font-mono ${
                        odd === "-"
                          ? "bg-slate-800/50 text-gray-600 cursor-not-allowed border border-gray-700"
                          : "bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
                      }`}
                      style={{ clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)" }}
                    >
                      <span className="text-[10px] text-purple-400 block mb-1 tracking-widest">
                        {idx === 0 ? "[1]" : idx === 1 ? "[X]" : "[2]"}
                      </span>
                      <span className="text-lg">{odd}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
