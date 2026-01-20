"use client"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Trophy, Users, Settings, HelpCircle, LogOut, ChevronRight, Volume2, Globe } from "lucide-react"
import { useState } from "react"
import { Logo } from "../ui/logo"
import Link from "next/link"
import ResponsibleGaming from "../compliance/responsible-gaming"
import LanguageSwitcher from "../i18n/language-switcher"

export function UserMenu() {
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [showResponsibleGaming, setShowResponsibleGaming] = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)

  const [user] = useState({
    name: "CasinoKing92",
    level: "Level 3 Player",
    vipProgress: 60,
    balance: 125679,
  })

  const menuItems = [
    {
      icon: Trophy,
      label: "Missions",
      hasChevron: true,
      href: "/p/dashboard/missions",
    },
    {
      icon: Volume2,
      label: "Audio & Music",
      hasToggle: true,
      enabled: audioEnabled,
    },
    {
      icon: Users,
      label: "Leaderboard",
      hasChevron: true,
      href: "/p/dashboard/leaderboard",
    },
    {
      icon: Users,
      label: "Friends",
      hasChevron: true,
      href: "/p/dashboard/friends",
    },
    {
      icon: Settings,
      label: "Settings",
      hasChevron: true,
      href: "/p/dashboard/settings",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      hasChevron: true,
      href: "/p/dashboard/help",
    },
  ]

  return (
    <div className="pb-20 px-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Logo size="large" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLanguageSwitcher(!showLanguageSwitcher)}
            className="px-3 py-2 bg-[#2A3F55] hover:bg-[#3A4F65] text-[#FFD700] rounded-lg font-semibold transition-colors flex items-center gap-2"
            title="Change Language"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Language</span>
          </button>
          <button
            onClick={() => setShowResponsibleGaming(true)}
            className="px-4 py-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Responsible Gaming</span>
          </button>
        </div>
      </div>

      {/* Language Switcher Dropdown */}
      {showLanguageSwitcher && (
        <div className="mb-6 p-4 bg-[#0D1F35]/80 border border-[#2A3F55] rounded-lg">
          <h3 className="text-sm font-bold text-[#FFD700] mb-3">Select Language</h3>
          <LanguageSwitcher />
        </div>
      )}

      {/* User Profile Card */}
      <Card3D className="mb-8">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-3xl">👨‍💼</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-muted-foreground">{user.level}</p>
            </div>
          </div>

          {/* VIP Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">VIP Progress</span>
              <span className="text-sm text-secondary font-bold">{user.vipProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${user.vipProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/50 rounded-xl p-6 hover:border-[#FFD700] transition-colors">
              <p className="text-sm text-[#B8C5D6] mb-2">Account Balance</p>
              <h3 className="text-4xl font-bold text-[#FFD700] mb-2">$2,500.00</h3>
              <button className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 font-semibold">+ Deposit</button>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/50 rounded-xl p-6 hover:border-green-500 transition-colors">
              <p className="text-sm text-[#B8C5D6] mb-2">Available for Betting</p>
              <h3 className="text-4xl font-bold text-green-400 mb-2">$2,500.00</h3>
              <p className="text-xs text-[#B8C5D6]">Ready to place bets</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/50 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <p className="text-sm text-[#B8C5D6] mb-2">Open Bets</p>
              <h3 className="text-4xl font-bold text-blue-400 mb-2">3</h3>
              <p className="text-xs text-[#B8C5D6]">Waiting for results</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <Link href="/p/dashboard">
                  <button className="w-full mb-4 px-4 py-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] rounded-lg font-semibold transition-colors">
                    Place New Bet
                  </button>
                </Link>
                <Link href="/p/dashboard/casino">
                  <button className="w-full mb-4 px-4 py-3 border border-[#FFD700] text-[#FFD700] rounded-lg font-semibold hover:bg-[#FFD700]/10 transition-colors">
                    View Casino Games
                  </button>
                </Link>

                <Link href="/p/dashboard/kyc-verification">
                  <button className="w-full px-4 py-3 border border-[#2A3F55] text-[#B8C5D6] rounded-lg font-semibold hover:bg-[#1A2F45] transition-colors">
                    Kyc-Verification
                  </button>
                </Link>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Account Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#B8C5D6]">Age Verification</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-semibold">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#B8C5D6]">Account Status</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#B8C5D6]">Responsible Gaming</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-semibold">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-center">
            {/* <p className="text-muted-foreground mb-1">Balance</p> */}
            <div className="text-2xl font-bold gradient-text mb-4">${user.balance.toLocaleString()}</div>
            <AnimatedButton variant="primary" size="sm" className="w-full">
              Top Up
            </AnimatedButton>
          </div>
        </div>
      </Card3D>

      {/* More Tools Section */}
      <div className="mb-8">
        <h3 className="font-bold mb-4">More Tools</h3>
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Card3D key={index}>
              <div
                className="w-full glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => {
                  if (item.href) window.location.href = item.href
                }}
              >
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>

                {item.href ? (
                  <Link href={item.href} className="flex-1 text-left font-medium" onClick={(e) => e.stopPropagation()}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}

                {item.hasChevron && <ChevronRight className="w-5 h-5 text-muted-foreground" />}

                {item.hasToggle && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.label === "Audio & Music") {
                        setAudioEnabled(!audioEnabled)
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      item.enabled ? "bg-primary" : "bg-gray-600"
                    } flex items-center`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        item.enabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                )}
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <Card3D className="mb-8">
        <button
          onClick={() => (window.location.href = "/")}
          className="w-full glass p-4 rounded-xl flex items-center gap-4 hover:bg-red-500/10 transition-colors text-red-400 "
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="flex-1 text-left font-medium">Logout</span>
        </button>
      </Card3D>

      {/* Responsible Gaming Modal */}
      {showResponsibleGaming && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0D1F35] border-b border-[#2A3F55] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#F5F5F5]">Responsible Gaming</h2>
              <button
                onClick={() => setShowResponsibleGaming(false)}
                className="text-[#B8C5D6] hover:text-[#F5F5F5] text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ResponsibleGaming />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
