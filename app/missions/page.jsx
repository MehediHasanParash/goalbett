"use client"
import { useState } from "react"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import useSWR from "swr"
import {
  Trophy,
  Target,
  DollarSign,
  Flame,
  Gamepad2,
  Wallet,
  Calendar,
  Users,
  ChevronLeft,
  Gift,
  CheckCircle2,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { getAuthToken } from "@/lib/auth-service"

const fetcher = async (url) => {
  const token = getAuthToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

const MISSION_ICONS = {
  trophy: Trophy,
  target: Target,
  dollar: DollarSign,
  flame: Flame,
  gamepad: Gamepad2,
  wallet: Wallet,
  calendar: Calendar,
  users: Users,
}

const CATEGORY_COLORS = {
  betting: "from-blue-500 to-blue-600",
  casino: "from-purple-500 to-purple-600",
  social: "from-cyan-500 to-cyan-600",
  deposit: "from-green-500 to-green-600",
  loyalty: "from-yellow-500 to-yellow-600",
}

export default function MissionsPage() {
  const { isAuthenticated, loading } = useAuth()
  const { primaryColor } = useTenant()
  const [activeTab, setActiveTab] = useState("all")
  const [claiming, setClaiming] = useState(null)

  const accentColor = primaryColor || "#FFD700"

  const { data, error, isLoading, mutate } = useSWR(
    `/api/missions${activeTab !== "all" ? `?type=${activeTab}` : ""}`,
    fetcher,
  )

  const missions = data?.missions || []

  const handleClaim = async (missionId) => {
    setClaiming(missionId)
    try {
      const token = getAuthToken()
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ missionId }),
      })
      const result = await res.json()
      if (result.success) {
        mutate()
        alert(`Claimed: ${result.reward.description}`)
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert("Failed to claim reward")
    } finally {
      setClaiming(null)
    }
  }

  const tabs = [
    { id: "all", label: "All" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "special", label: "Special" },
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready to Claim
          </span>
        )
      case "claimed":
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full flex items-center gap-1">
            <Gift className="w-3 h-3" /> Claimed
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: accentColor }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      <BettingHeader />

      <main className="container mx-auto px-4 py-6 pb-24 pt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/menu" className="p-2 hover:bg-[#1A2F45] rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Missions</h1>
            <p className="text-[#B8C5D6] text-sm">Complete missions to earn rewards</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: accentColor }}>
              {missions.filter((m) => m.userProgress?.status === "completed").length}
            </div>
            <div className="text-xs text-[#B8C5D6]">Completed</div>
          </Card>
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {missions.filter((m) => m.userProgress?.status === "active").length}
            </div>
            <div className="text-xs text-[#B8C5D6]">Active</div>
          </Card>
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${missions.reduce((sum, m) => sum + (m.reward?.amount || 0), 0)}
            </div>
            <div className="text-xs text-[#B8C5D6]">Total Rewards</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? "text-[#0A1A2F]" : "bg-[#1A2F45]/50 text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
              style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Missions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 animate-pulse">
                <div className="h-20 bg-[#2A3F55] rounded" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/30 p-6 text-center">
            <p className="text-red-400">Failed to load missions</p>
          </Card>
        ) : missions.length === 0 ? (
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-[#B8C5D6]" />
            <p className="text-[#B8C5D6]">No missions available</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => {
              const IconComponent = MISSION_ICONS[mission.icon] || Trophy
              const progress = mission.userProgress?.progress || 0
              const target = mission.requirements?.target || 1
              const progressPercent = Math.min((progress / target) * 100, 100)
              const isCompleted = mission.userProgress?.status === "completed"
              const isClaimed = mission.userProgress?.status === "claimed"

              return (
                <Card
                  key={mission._id}
                  className={`bg-[#1A2F45]/50 border-[#2A3F55] overflow-hidden ${isClaimed ? "opacity-60" : ""}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          CATEGORY_COLORS[mission.category] || "from-gray-500 to-gray-600"
                        } flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-lg">{mission.title}</h3>
                          {getStatusBadge(mission.userProgress?.status)}
                        </div>
                        <p className="text-[#B8C5D6] text-sm mb-3">{mission.description}</p>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#B8C5D6]">Progress</span>
                            <span style={{ color: accentColor }}>
                              {progress} / {target}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>

                        {/* Reward & Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4" style={{ color: accentColor }} />
                            <span className="text-sm font-medium" style={{ color: accentColor }}>
                              {mission.reward?.description}
                            </span>
                          </div>
                          {isCompleted && !isClaimed && (
                            <Button
                              size="sm"
                              onClick={() => handleClaim(mission._id)}
                              disabled={claiming === mission._id}
                              style={{ backgroundColor: accentColor, color: "#0A1A2F" }}
                            >
                              {claiming === mission._id ? "Claiming..." : "Claim"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {isAuthenticated && <BottomNavigation activeTab="menu" />}
    </div>
  )
}
