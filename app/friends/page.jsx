"use client"
import { useState } from "react"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { Users, UserPlus, Check, X, Copy, Share2, ChevronLeft, Gift, Trophy, Clock, Search } from "lucide-react"
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

export default function FriendsPage() {
  const { isAuthenticated, loading } = useAuth()
  const { primaryColor } = useTenant()
  const [activeTab, setActiveTab] = useState("friends")
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState(false)

  const accentColor = primaryColor || "#FFD700"

  const { data, error, isLoading, mutate } = useSWR("/api/friends", fetcher)

  const friends = data?.friends || []
  const pending = data?.pending || []
  const referral = data?.referral || {}

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "pending", label: "Pending", count: pending.length },
    { id: "referrals", label: "Referrals", count: referral.totalReferred || 0 },
  ]

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referral.code || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on GoalBett!",
          text: `Use my referral code ${referral.code} to get a bonus!`,
          url: referral.link,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      handleCopyCode()
    }
  }

  const handleFriendAction = async (action, friendId) => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, friendId }),
      })
      const result = await res.json()
      if (result.success) {
        mutate()
      }
    } catch (err) {
      console.error("Friend action failed:", err)
    }
  }

  const filteredFriends = friends.filter((f) => f.username.toLowerCase().includes(searchQuery.toLowerCase()))

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
        <BettingHeader />
        <main className="container mx-auto px-4 py-6 pb-24 pt-20">
          <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-[#B8C5D6]" />
            <h2 className="text-xl font-bold mb-2">Login Required</h2>
            <p className="text-[#B8C5D6] mb-4">Please login to view your friends</p>
            <Link href="/auth">
              <Button style={{ backgroundColor: accentColor, color: "#0A1A2F" }}>Login</Button>
            </Link>
          </Card>
        </main>
        <BottomNavigation activeTab="menu" />
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
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-[#B8C5D6] text-sm">Connect and compete with friends</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? "text-[#0A1A2F]" : "bg-[#1A2F45]/50 text-[#B8C5D6] hover:bg-[#1A2F45]"
              }`}
              style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? "bg-[#0A1A2F]/20" : "bg-[#2A3F55]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8C5D6]" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A2F45]/50 border-[#2A3F55]"
              />
            </div>

            {/* Add Friend */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <UserPlus className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1">
                  <Input placeholder="Enter username to add..." className="bg-[#0A1A2F] border-[#2A3F55]" />
                </div>
                <Button size="sm" style={{ backgroundColor: accentColor, color: "#0A1A2F" }}>
                  Add
                </Button>
              </div>
            </Card>

            {/* Friends List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 animate-pulse">
                    <div className="h-14 bg-[#2A3F55] rounded" />
                  </Card>
                ))}
              </div>
            ) : filteredFriends.length === 0 ? (
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-[#B8C5D6]" />
                <p className="text-[#B8C5D6]">No friends found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFriends.map((friend) => (
                  <Card key={friend.id} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2A3F55] to-[#1A2F45] flex items-center justify-center text-xl">
                          {friend.username.charAt(0)}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1A2F45] ${
                            friend.status === "online" ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{friend.username}</p>
                        <div className="flex items-center gap-3 text-xs text-[#B8C5D6]">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" style={{ color: accentColor }} /> {friend.wins} wins
                          </span>
                          <span>{friend.bets} bets</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs ${friend.status === "online" ? "text-green-400" : "text-[#B8C5D6]"}`}>
                          {friend.status === "online" ? "Online" : friend.lastActive}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pending Tab */}
        {activeTab === "pending" && (
          <>
            {pending.length === 0 ? (
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-[#B8C5D6]" />
                <p className="text-[#B8C5D6]">No pending requests</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((request) => (
                  <Card key={request.id} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2A3F55] to-[#1A2F45] flex items-center justify-center text-xl">
                        {request.username.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{request.username}</p>
                        <p className="text-xs text-[#B8C5D6]">Sent {request.sentAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/30"
                          onClick={() => handleFriendAction("accept", request.id)}
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/30"
                          onClick={() => handleFriendAction("decline", request.id)}
                        >
                          <X className="w-5 h-5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <>
            {/* Referral Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: accentColor }}>
                  {referral.totalReferred || 0}
                </div>
                <div className="text-xs text-[#B8C5D6]">Referred</div>
              </Card>
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
                <div className="text-2xl font-bold text-green-400">${referral.totalEarned || 0}</div>
                <div className="text-xs text-[#B8C5D6]">Earned</div>
              </Card>
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">${referral.pendingRewards || 0}</div>
                <div className="text-xs text-[#B8C5D6]">Pending</div>
              </Card>
            </div>

            {/* Referral Code Card */}
            <Card
              className="bg-gradient-to-r from-[#1A2F45] to-[#2A3F55] border-2 p-6 mb-6"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-6 h-6" style={{ color: accentColor }} />
                <h3 className="font-bold text-lg">Your Referral Code</h3>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex-1 text-center py-3 rounded-lg text-2xl font-bold tracking-wider"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {referral.code || "LOADING..."}
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-transparent" variant="outline" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleShare}
                  style={{ backgroundColor: accentColor, color: "#0A1A2F" }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              <p className="text-center text-sm text-[#B8C5D6] mt-4">Earn $50 for each friend who deposits!</p>
            </Card>

            {/* Referral History */}
            <h3 className="font-bold mb-3">Referral History</h3>
            {referral.referrals?.length > 0 ? (
              <div className="space-y-3">
                {referral.referrals.map((ref, index) => (
                  <Card key={index} className="bg-[#1A2F45]/50 border-[#2A3F55] p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A3F55] to-[#1A2F45] flex items-center justify-center">
                        {ref.username.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{ref.username}</p>
                        <p className="text-xs text-[#B8C5D6]">{ref.date}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ref.status === "deposited"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {ref.status === "deposited" ? "Deposited" : "Registered"}
                        </span>
                        {ref.reward > 0 && <p className="text-green-400 font-bold text-sm mt-1">+${ref.reward}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-[#B8C5D6]" />
                <p className="text-[#B8C5D6]">No referrals yet. Share your code to start earning!</p>
              </Card>
            )}
          </>
        )}
      </main>

      <BottomNavigation activeTab="menu" />
    </div>
  )
}
