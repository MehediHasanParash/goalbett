"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/ui/logo"
import { AnimatedButton } from "@/components/ui/animated-button"
import { LandPlot, MonitorDot, Search, Trophy, MenuIcon, X, UserCircle, Wallet, Globe } from "lucide-react"
import Link from "next/link"
import BottomNavigation from "@/components/ui/bottom-navigation"
import { BetSlip } from "@/components/dashboard/bet-slip"
import {
  AnimatedCricketIcon,
  AnimatedSoccerIcon,
  AnimatedCasinoIcon,
  AnimatedBasketballIcon,
  AnimatedHorsesIcon,
  AnimatedEsportsIcon,
  AnimatedTennisIcon,
  AnimatedVirtualIcon,
  AnimatedBoxingIcon,
  AnimatedGolfIcon,
  AnimatedFormula1Icon,
} from "@/components/ui/animated-sport-icons"
import { FloatingGuestBetslip } from "@/components/guest/floating-guest-betslip"
import { PromotionalBanner } from "@/components/ui/promotional-banner"
import { BrandedButton } from "@/components/ui/branded-button"
import Image from "next/image"
import LanguageSwitcher from "@/components/i18n/language-switcher"

export default function PlayerDashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [selectedSport, setSelectedSport] = useState("soccer")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)

  useEffect(() => {
    setMounted(true)
    // If not authenticated, redirect to home
    // If authenticated, the home page will show the player version
    if (!isAuthenticated) {
      router.replace("/")
    }
  }, [router, isAuthenticated])

  if (!mounted) return null

  const featuredMatches = [
    {
      id: 1,
      teams: "BRENTFORD V MAN UTD",
      league: "Premier League",
      betBoost: "BET BOOST",
      placed: "673 placed",
      markets: [
        { type: "Both Teams to Receive 2+ Cards", odds: null },
        { type: "Both Teams to Score", odds: null },
        { type: "Over 1 Corners in the 1st Half for Brentford", odds: null },
      ],
      mainOdds: {
        was: "15.00",
        now: "17.00",
        returns: "$10 stake returns $170",
      },
      time: "Sat 27 Sep",
    },
    {
      id: 2,
      teams: "BRENTFORD V MAN UTD",
      league: "Premier League",
      betBoost: "BET BOOST",
      placed: "314 placed",
      markets: [
        { type: "Igor Thiago: 1+ Shots on Target", odds: null },
        { type: "Kevin Schade: 1+ Shots on Target", odds: null },
        { type: "Bryan Mbeumo: 1+ Shots on Target", odds: null },
      ],
      mainOdds: { was: "7.50", now: "8.50", returns: "$10 stake returns $85" },
      time: "Sat 27 Sep",
    },
    {
      id: 3,
      teams: "BRENTFORD V MAN UTD",
      league: "Premier League",
      betBoost: "BET BOOST",
      placed: "321 placed",
      markets: [
        {
          type: "Over 1.5 Shots on Target in the 1st Half for Man Utd",
          odds: null,
        },
        {
          type: "Over 1.5 Shots on Target in the 2nd Half for Man Utd",
          odds: null,
        },
        {
          type: "Over 1.5 Shots on Target in the 1st Half for Brentford",
          odds: null,
        },
      ],
      mainOdds: {
        was: "17.00",
        now: "19.00",
        returns: "$10 stake returns $190",
      },
      time: "Sat 27 Sep",
    },
    {
      id: 4,
      teams: "CHELSEA V BRIGHTON",
      league: "Premier League",
      betBoost: "BET BOOST",
      placed: "1 placed",
      markets: [
        { type: "Joao Pedro: 2+ Shots on Target", odds: null },
        { type: "Pedro Neto: 2+ Shots on Target", odds: null },
        { type: "FT Result: Chelsea", odds: null },
        { type: "Over 2 Goals", odds: null },
      ],
      mainOdds: {
        was: "12.00",
        now: "13.00",
        returns: "$10 stake returns $130",
      },
      time: "Sat 27 Sep",
    },
  ]

  const liveMatches = [
    {
      id: 1,
      team1: "Platense",
      team2: "San Martin SJ",
      score1: 1,
      score2: 1,
      odds: ["2.25", "2.30", "5.50"],
      time: "42:02",
    },
    {
      id: 2,
      team1: "Banfield",
      team2: "Union Santa Fe",
      score1: 0,
      score2: 0,
      odds: ["2.87", "2.60", "3.00"],
      time: "43:11",
    },
    {
      id: 3,
      team1: "Colo Colo",
      team2: "Deportes Iquique",
      score1: 1,
      score2: 0,
      odds: ["1.12", "7.50", "21.00"],
      time: "40:20",
    },
    {
      id: 4,
      team1: "Once Caldas",
      team2: "",
      score1: null,
      score2: null,
      odds: [],
      time: "",
    },
  ]

  const sportsCategories = [
    { id: "american-football", name: "American Football", icon: "🏈" },
    { id: "australian-rules", name: "Australian Rules", icon: "🏉" },
    { id: "badminton", name: "Badminton", icon: "🏸" },
    { id: "baseball", name: "Baseball", icon: "⚾" },
    { id: "basketball", name: "Basketball", icon: "🏀" },
    { id: "beach-volleyball", name: "Beach Volleyball", icon: "🏐" },
    { id: "boxing", name: "Boxing", icon: "🥊" },
    { id: "casino", name: "Casino", icon: "🎰" },
    { id: "cricket", name: "Cricket", icon: "🏏" },
    { id: "cycling", name: "Cycling", icon: "🚴" },
    { id: "darts", name: "Darts", icon: "🎯" },
    { id: "esports", name: "Esports", icon: "🎮" },
    { id: "floorball", name: "Floorball", icon: "🏑" },
    { id: "formula-1", name: "Formula 1", icon: "🏎️" },
    { id: "futsal", name: "Futsal", icon: "⚽" },
    { id: "gaelic-sports", name: "Gaelic Sports", icon: "🥍" },
    { id: "golf", name: "Golf", icon: "⛳" },
  ]

  const addToGuestBetslip = (match, selection, odds) => {
    const bet = {
      id: `${match.id}-${selection}-${Date.now()}`,
      match: match.teams || `${match.team1} vs ${match.team2}`,
      selection: selection,
      odds: Number.parseFloat(odds),
      stake: 10,
    }

    // Dispatch custom event to notify betslip
    window.dispatchEvent(new CustomEvent("addGuestBet", { detail: bet }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A1A2F]/95 backdrop-blur-sm border-b border-[#2A3F55]">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2 border-b border-[#2A3F55]">
            <div className="flex items-center space-x-2 md:space-x-6">
              <Logo size="large" />
              <nav className="hidden lg:flex items-center space-x-6 text-sm">
                <Link href="/p/dashboard" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  Sports
                </Link>
                <Link href="/p/dashboard/in-play" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  In-Play
                </Link>
                <Link href="/p/dashboard/casino" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  Casino
                </Link>
                <Link href="/p/dashboard/bet-history" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
                  My Bets
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setShowLanguageSwitcher(!showLanguageSwitcher)}
                className="px-3 py-2 bg-[#2A3F55] hover:bg-[#3A4F65] text-[#FFD700] rounded-lg font-semibold transition-colors flex items-center gap-2"
                title="Change Language"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Lang</span>
              </button>
              <Link href="/p/dashboard/wallet" className="sm:inline">
                <Wallet className="w-6 h-6 text-[#FFD700] hover:text-[#FFD700]/70" />
              </Link>

              <span className="hidden md:inline text-[#B8C5D6] text-sm">Responsible Gambling</span>
              <span className="hidden sm:inline text-[#B8C5D6] text-sm">Help</span>

              <Link href="/p/dashboard" className="hidden sm:inline">
                <UserCircle className="w-6 h-6 text-[#FFD700] hover:text-[#FFD700]/70" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#B8C5D6] hover:text-[#FFD700]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Language Switcher Dropdown */}
          {showLanguageSwitcher && (
            <div className="py-2 px-4 bg-[#0D1F35]/90 border-b border-[#2A3F55]">
              <p className="text-xs text-[#FFD700] mb-2">Select Language:</p>
              <LanguageSwitcher />
            </div>
          )}

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-b border-[#2A3F55]">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/p/dashboard"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sports
                </Link>
                <Link
                  href="/p/dashboard/in-play"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  In-Play
                </Link>
                <Link
                  href="/p/dashboard/casino"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Casino
                </Link>
                <Link
                  href="/p/dashboard/bet-history"
                  className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors px-2 py-1 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Receipt className="w-4 h-4" />
                  My Bets
                </Link>
                <div className="flex flex-col space-y-2 pt-2 sm:hidden">
                  <Link href="/p/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <AnimatedButton
                      variant="glass"
                      className="text-[#F5F5F5] border-[#2A3F55] flex items-center justify-center hover:border-[#FFD700] w-full"
                      size="sm"
                    >
                      <UserCircle className="w-7 h-7 text-[#FFD700] hover:text-[#FFD700]/70" />
                    </AnimatedButton>
                  </Link>
                </div>
              </nav>
            </div>
          )}

          {/* Main Navigation */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8"></div>
              <div className="flex items-center space-x-4 flex-1 justify-end">
                <div className="relative w-full max-w-xs md:max-w-md lg:max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8C5D6]" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-10 pr-4 py-2 w-full bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6] focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full mt-12 mx-auto px-2 sm:px-4 lg:px-6 py-6 pt-32 sm:pt-36 md:pt-44 pb-24">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-6">
          {/* Left Sidebar */}
          <div
            className={`${
              mobileSidebarOpen ? "fixed inset-0 z-40 bg-[#0A1A2F]/95 backdrop-blur-sm" : "hidden"
            } lg:block lg:w-64 lg:flex-shrink-0 lg:static`}
          >
            <div className={`${mobileSidebarOpen ? "w-64 h-full overflow-y-auto p-4" : ""} lg:w-full`}>
              {mobileSidebarOpen && (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden absolute top-4 right-4 p-2 text-[#B8C5D6] hover:text-[#FFD700] z-50"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              {/* Offers Section */}
              <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-4 shadow-xl mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center">
                    <span className="text-[#0A1A2F] text-xs font-bold">$</span>
                  </div>
                  <h3 className="text-[#F5F5F5] font-semibold">Offers</h3>
                </div>
              </div>

              {/* Most Used Section */}
              <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-4 shadow-xl mb-4">
                <h3 className="text-[#FFD700] font-semibold mb-3">MOST USED</h3>
                <div className="space-y-1">
                  <div className="text-[#B8C5D6] font-semibold mb-2">A-Z</div>
                  {sportsCategories.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => {
                        setSelectedSport(sport.id)
                        setMobileSidebarOpen(false)
                      }}
                      className={`w-full flex items-center space-x-2 p-2 rounded text-left transition-colors ${
                        selectedSport === sport.id
                          ? "bg-[#FFD700] text-[#0A1A2F]"
                          : "text-[#B8C5D6] hover:bg-[#1A2F45] hover:text-[#F5F5F5]"
                      }`}
                    >
                      <span className="text-sm">{sport.icon}</span>
                      <span className="text-sm">{sport.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden mb-4 w-full bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-3 flex items-center justify-center space-x-2 text-[#F5F5F5] hover:border-[#FFD700] transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
              <span>Browse Sports</span>
            </button>

            {/* Promotional Banner Component */}
            <PromotionalBanner />

            {/* Hero Section with Sports and Casino Visuals */}
            <div className="bg-gradient-to-r from-[#0D1F35] via-[#1A2F45] to-[#0D1F35] border border-[#FFD700]/30 rounded-2xl p-6 md:p-8 shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <Image src="/sports-betting-interface.jpg" alt="" fill className="object-cover" />
              </div>
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative h-48 rounded-xl overflow-hidden border-2 border-[#FFD700]/50 group">
                    <Image
                      src="/abstract-sports-betting-background.jpg"
                      alt="Sports Betting"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-transparent to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#FFD700] mb-1">Sports Betting</h3>
                        <p className="text-sm text-[#F5F5F5]">Live odds on 1000+ matches daily</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-48 rounded-xl overflow-hidden border-2 border-[#FFD700]/50 group">
                    <Image
                      src="/casino-roulette-table.jpg"
                      alt="Casino Games"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F] via-transparent to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#FFD700] mb-1">Casino Games</h3>
                        <p className="text-sm text-[#F5F5F5]">Slots, Roulette, Blackjack & More</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] mb-3">
                    Welcome to Goal-Bett - Your Premier Betting Destination
                  </h2>
                  <p className="text-[#B8C5D6] mb-4">
                    Experience the thrill of sports betting and casino games with the best odds in the market
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/auth/unified">
                      <BrandedButton variant="primary" size="lg">
                        Join Now & Get Bonus
                      </BrandedButton>
                    </Link>
                    <Link href="/p/dashboard/casino">
                      <BrandedButton variant="accent" size="lg">
                        Explore Casino
                      </BrandedButton>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sports Category Icons */}
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-3 md:p-4 shadow-xl mb-4 md:mb-6">
              <div className="flex items-center justify-start md:justify-center space-x-4 md:space-x-6 lg:space-x-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  {
                    name: "Cricket",
                    icon: <AnimatedCricketIcon className="h-10 md:h-12 lg:h-14" />,
                  },
                  {
                    name: "Soccer",
                    icon: <AnimatedSoccerIcon className="h-10 md:h-12 lg:h-14" />,
                  },
                  {
                    name: "Casino",
                    icon: <AnimatedCasinoIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Basketball",
                    icon: <AnimatedBasketballIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Horses",
                    icon: <AnimatedHorsesIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Esports",
                    icon: <AnimatedEsportsIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Tennis",
                    icon: <AnimatedTennisIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Virtual",
                    icon: <AnimatedVirtualIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Boxing",
                    icon: <AnimatedBoxingIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Golf",
                    icon: <AnimatedGolfIcon className="h-8 md:h-10 lg:h-12" />,
                  },
                  {
                    name: "Formula 1",
                    icon: <AnimatedFormula1Icon className="h-8 md:h-10 lg:h-12" />,
                  },
                ].map((sport, index) => (
                  <div key={index} className="flex flex-col items-center space-y-1 min-w-0 flex-shrink-0">
                    <div className="w-14 h-12 sm:w-16 sm:h-14 md:w-18 md:h-16 lg:w-20 lg:h-18 bg-[#1A2F45] rounded-lg border border-[#2A3F55] p-2 md:p-3 lg:p-4 shadow-xl flex items-center justify-center text-xl hover:bg-[#FFD700]/20 hover:border-[#FFD700] transition-colors cursor-pointer">
                      {sport.icon}
                    </div>
                    <span className="text-xs text-[#B8C5D6] text-center whitespace-nowrap">{sport.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Soccer Navigation Tabs */}
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-3 md:p-4 shadow-xl mb-4 md:mb-6">
              <div className="flex items-center space-x-4 md:space-x-6 border-b border-[#2A3F55] pb-3 overflow-x-auto scrollbar-hide">
                <button className="text-[#F5F5F5] font-semibold border-b-2 border-[#FFD700] pb-2 whitespace-nowrap text-sm md:text-base">
                  Soccer
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base">
                  ATP
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base">
                  WTA Beijing
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base hidden md:inline">
                  WTA Beijing
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base">
                  Esoccer
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base hidden lg:inline">
                  Upcoming Races - Horses
                </button>
                <button className="text-[#B8C5D6] hover:text-[#F5F5F5] transition-colors whitespace-nowrap text-sm md:text-base">
                  In-Play
                </button>
              </div>
            </div>

            {/* Featured Matches */}
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-3 md:p-4 shadow-xl mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#F5F5F5] flex items-center space-x-2">
                  <span>⚽</span>
                  <span className="hidden sm:inline">FEATURED MATCHES</span>
                  <span className="sm:hidden">FEATURED</span>
                </h2>
                <button className="text-[#B8C5D6] hover:text-[#FFD700] text-xs md:text-sm">View All</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {featuredMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-[#1A2F45]/50 backdrop-blur-sm border border-[#2A3F55] rounded-lg p-3 md:p-4 hover:bg-[#1A2F45] hover:border-[#FFD700] cursor-pointer transition-colors"
                  >
                    {/* Bet Boost Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-[#FFD700] text-[#0A1A2F] text-xs px-2 py-1 rounded font-semibold">
                          {match.betBoost}
                        </span>
                        <span className="text-[#FFD700] text-xs">🔥 {match.placed}</span>
                      </div>
                    </div>

                    {/* Team Names */}
                    <div className="mb-3">
                      <h3 className="text-[#F5F5F5] font-semibold text-sm mb-1">{match.teams}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-[#B8C5D6]">👕</span>
                        <span className="text-xs text-[#B8C5D6]">👕</span>
                      </div>
                    </div>

                    {/* Markets */}
                    <div className="space-y-1 mb-4">
                      {match.markets.slice(0, 2).map((market, index) => (
                        <div key={index} className="text-xs text-[#B8C5D6] truncate">
                          • {market.type}
                        </div>
                      ))}
                      <button className="text-[#FFD700] text-xs hover:text-[#FFD700]/80">View more legs</button>
                    </div>

                    {/* Odds */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <span className="text-[#B8C5D6] text-sm line-through">{match.mainOdds.was}</span>
                        <span className="text-[#F5F5F5] text-lg md:text-xl font-bold">▶ {match.mainOdds.now}</span>
                      </div>
                      <div className="text-xs text-[#B8C5D6] mb-3 hidden sm:block">{match.mainOdds.returns}</div>
                      <div className="text-xs text-[#B8C5D6]">{match.time}</div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() =>
                          addToGuestBetslip(match, "Bet Boost Combo", Number.parseFloat(match.mainOdds.now))
                        }
                        className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 font-bold py-2 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                      >
                        Bet Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Matches */}
            <div className="space-y-3 md:space-y-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl shadow-xl p-3 md:p-4"
                >
                  {match.team2 ? (
                    <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                      {/* Match Info */}
                      <div className="col-span-2 md:col-span-1 text-center">
                        <div className="text-xs text-[#B8C5D6]">{match.time}</div>
                        <div className="text-xs text-[#FFD700] flex justify-center">
                          <MonitorDot className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="col-span-5 md:col-span-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                              <Trophy className="w-3 h-3 md:w-4 md:h-4 text-[#FFD700] flex-shrink-0" />
                              <span className="text-[#F5F5F5] text-xs md:text-sm truncate">{match.team1}</span>
                            </div>
                            <span className="text-[#F5F5F5] font-bold text-sm md:text-base ml-2 flex-shrink-0">
                              {match.score1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                              <LandPlot className="w-3 h-3 md:w-4 md:h-4 text-[#B8C5D6] flex-shrink-0" />
                              <span className="text-[#F5F5F5] text-xs md:text-sm truncate">{match.team2}</span>
                            </div>
                            <span className="text-[#F5F5F5] font-bold text-sm md:text-base ml-2 flex-shrink-0">
                              {match.score2}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-5 md:col-span-7">
                        <div className="grid grid-cols-3 gap-1 md:gap-2">
                          {match.odds.map((odd, index) => {
                            const selections = ["Home Win", "Draw", "Away Win"]
                            return (
                              <button
                                key={index}
                                onClick={() => addToGuestBetslip(match, selections[index], odd)}
                                className="bg-[#1A2F45] border border-[#2A3F55] hover:bg-[#FFD700] hover:text-[#0A1A2F] text-[#F5F5F5] p-1.5 md:p-2 rounded text-xs md:text-sm font-bold transition-all duration-300 hover:scale-105"
                              >
                                {odd}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-[#F5F5F5] text-sm md:text-base">{match.team1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <FloatingGuestBetslip /> */}
      <BottomNavigation onBetSlipClick={() => setBetSlipOpen(true)} betSlipCount={2} />
      <BetSlip isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
