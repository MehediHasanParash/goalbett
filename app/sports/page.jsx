"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, TrendingUp, Clock, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/ui/logo"
import BottomNavigation from "@/components/ui/bottom-navigation"
import {
  AnimatedSoccerIcon,
  AnimatedBasketballIcon,
  AnimatedTennisIcon,
  AnimatedCricketIcon,
  AnimatedBoxingIcon,
  AnimatedGolfIcon,
  AnimatedFormula1Icon,
} from "@/components/ui/animated-sport-icons"

export default function SportsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const sports = [
    { name: "Soccer", icon: AnimatedSoccerIcon, matches: 245, href: "/dashboard" },
    { name: "Basketball", icon: AnimatedBasketballIcon, matches: 89, href: "/dashboard" },
    { name: "Tennis", icon: AnimatedTennisIcon, matches: 156, href: "/dashboard" },
    { name: "Cricket", icon: AnimatedCricketIcon, matches: 67, href: "/dashboard" },
    { name: "Boxing", icon: AnimatedBoxingIcon, matches: 23, href: "/dashboard" },
    { name: "Golf", icon: AnimatedGolfIcon, matches: 45, href: "/dashboard" },
    { name: "Formula 1", icon: AnimatedFormula1Icon, matches: 12, href: "/dashboard" },
  ]

  const featuredMatches = [
    {
      id: 1,
      league: "Premier League",
      home: "Manchester United",
      away: "Liverpool",
      time: "Today, 15:00",
      odds: { home: "2.10", draw: "3.40", away: "3.20" },
      live: false,
    },
    {
      id: 2,
      league: "La Liga",
      home: "Real Madrid",
      away: "Barcelona",
      time: "Today, 18:00",
      odds: { home: "2.45", draw: "3.10", away: "2.90" },
      live: false,
    },
    {
      id: 3,
      league: "NBA",
      home: "Lakers",
      away: "Warriors",
      time: "Live Now",
      odds: { home: "1.85", draw: "-", away: "1.95" },
      live: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1A2F] via-[#0F2744] to-[#0A1A2F] pb-20">
      {/* Header */}
      <header className="bg-[#0A1A2F]/95 backdrop-blur-sm border-b border-[#FFD700]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="large" />
            <div className="flex items-center gap-4">
              <Link
                href="/auth"
                className="text-[#F5F5F5] hover:text-[#FFD700] transition-colors text-sm font-medium"
              >
                Log In
              </Link>
              <Link
                href="/auth"
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] px-6 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#0A1A2F]/80 backdrop-blur-sm border-b border-[#FFD700]/20 sticky top-[72px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <Link href="/sports" className="text-[#FFD700] font-semibold border-b-2 border-[#FFD700] pb-1">
              Sports
            </Link>
            <Link href="/in-play" className="text-[#F5F5F5]/80 hover:text-[#FFD700] transition-colors">
              In-Play
            </Link>
            <Link href="/casino" className="text-[#F5F5F5]/80 hover:text-[#FFD700] transition-colors">
              Casino
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for teams, leagues, or events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-[#FFD700]/30 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sports Categories */}
        <div>
          <h2 className="text-2xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
            <Star className="w-6 h-6" />
            Popular Sports
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {sports.map((sport) => (
              <Link key={sport.name} href={sport.href}>
                <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20 hover:border-[#FFD700] hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center gap-3">
                    <sport.icon className="w-16 h-16" />
                    <div className="text-center">
                      <p className="text-white font-semibold">{sport.name}</p>
                      <p className="text-xs text-[#F5F5F5]/70">{sport.matches} matches</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Matches */}
        <div>
          <h2 className="text-2xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Featured Matches
          </h2>
          <div className="space-y-4">
            {featuredMatches.map((match) => (
              <Card
                key={match.id}
                className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20 hover:border-[#FFD700] transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#FFD700] text-[#0A1A2F] text-xs">{match.league}</Badge>
                        {match.live && (
                          <Badge className="bg-red-500 text-white text-xs animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-semibold">{match.home}</p>
                        <p className="text-white font-semibold">{match.away}</p>
                      </div>
                      <p className="text-[#F5F5F5]/70 text-sm mt-2">{match.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center bg-[#0A1A2F]/50 px-4 py-2 rounded-lg border border-[#FFD700]/30 hover:bg-[#FFD700]/10 transition-colors cursor-pointer">
                        <p className="text-xs text-[#F5F5F5]/70">Home</p>
                        <p className="text-[#FFD700] font-bold text-lg">{match.odds.home}</p>
                      </div>
                      {match.odds.draw !== "-" && (
                        <div className="text-center bg-[#0A1A2F]/50 px-4 py-2 rounded-lg border border-[#FFD700]/30 hover:bg-[#FFD700]/10 transition-colors cursor-pointer">
                          <p className="text-xs text-[#F5F5F5]/70">Draw</p>
                          <p className="text-[#FFD700] font-bold text-lg">{match.odds.draw}</p>
                        </div>
                      )}
                      <div className="text-center bg-[#0A1A2F]/50 px-4 py-2 rounded-lg border border-[#FFD700]/30 hover:bg-[#FFD700]/10 transition-colors cursor-pointer">
                        <p className="text-xs text-[#F5F5F5]/70">Away</p>
                        <p className="text-[#FFD700] font-bold text-lg">{match.odds.away}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-[#FFD700] ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="home" />
    </div>
  )
}
