"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Phone, CreditCard, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function PlayerAccountCreator({ onPlayerCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    initialBalance: 0,
  })
  const [createdAccount, setCreatedAccount] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [recentPlayers, setRecentPlayers] = useState([])

  useEffect(() => {
    fetchRecentPlayers()
  }, [])

  const fetchRecentPlayers = async () => {
    try {
      console.log("[v0] PlayerAccountCreator: Starting fetchRecentPlayers")
      const token = getAuthToken()
      console.log("[v0] PlayerAccountCreator: Token exists?", !!token)

      if (!token) {
        console.log("[v0] PlayerAccountCreator: No auth token, skipping fetch")
        return
      }

      console.log("[v0] PlayerAccountCreator: Making API call to /api/users/players")
      const response = await fetch("/api/users/players", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("[v0] PlayerAccountCreator: Response status:", response.status)
      console.log("[v0] PlayerAccountCreator: Response ok?", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] PlayerAccountCreator: Received data:", data)
        console.log("[v0] PlayerAccountCreator: Players array:", data.players)
        console.log("[v0] PlayerAccountCreator: Players count:", data.players?.length)

        setRecentPlayers(data.players?.slice(0, 5) || [])
        console.log("[v0] PlayerAccountCreator: Set recent players (first 5)")
      } else {
        const errorData = await response.json()
        console.error("[v0] PlayerAccountCreator: API error response:", errorData)
      }
    } catch (error) {
      console.error("[v0] PlayerAccountCreator: Error fetching players:", error)
      console.error("[v0] PlayerAccountCreator: Error details:", error.message, error.stack)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateAccount = async () => {
    if (!formData.name || !formData.username) {
      setError("Please fill in name and username (required fields)")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError("Not authenticated. Please login.")
        setLoading(false)
        return
      }

      console.log("[v0] Creating player with data:", formData)

      const response = await fetch("/api/users/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create player")
        setLoading(false)
        return
      }

      console.log("[v0] Player created successfully:", data)

      setCreatedAccount({
        playerId: data.player.id,
        name: data.player.name,
        username: data.player.username,
        email: data.player.email,
        phone: formData.phone,
        initialBalance: data.player.balance,
        tempPassword: data.player.tempPassword,
        loginUrl: `${window.location.origin}/p/login`,
        createdAt: new Date().toISOString(),
      })

      // Reset form
      setFormData({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        initialBalance: 0,
      })

      // Refresh recent players list
      fetchRecentPlayers()

      if (onPlayerCreated) {
        onPlayerCreated()
      }
    } catch (error) {
      console.error("[v0] Error creating player:", error)
      setError("Failed to create player. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Creation Form */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#FFD700]" />
            Create New Player Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
              placeholder="Player's full name"
            />
          </div>

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
              placeholder="Unique username (lowercase, no spaces)"
            />
            <p className="text-xs text-[#B8C5D6] mt-1">Only letters, numbers, underscores and hyphens allowed</p>
          </div>

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Email Address (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#B8C5D6]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-10 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="player@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#B8C5D6]" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-10 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="+251912345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Password (Optional - auto-generated if empty)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="Leave empty for auto-generated password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#B8C5D6] hover:text-[#FFD700]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[#B8C5D6] text-sm mb-2">Initial Balance (ETB)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-[#B8C5D6]" />
              <input
                type="number"
                name="initialBalance"
                value={formData.initialBalance}
                onChange={handleInputChange}
                className="w-full bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg px-10 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <Button
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold h-12"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? "Creating Player..." : "Create Player Account"}
          </Button>
        </CardContent>
      </Card>

      {/* Created Account Details */}
      {createdAccount && (
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <CardTitle className="text-green-400">Player Account Created Successfully!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Details */}
            <div className="bg-[#1A2F45] border border-[#FFD700]/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#B8C5D6]">Player Name:</span>
                <span className="text-white font-semibold">{createdAccount.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#B8C5D6]">Username:</span>
                <span className="text-[#FFD700] font-mono font-bold">{createdAccount.username}</span>
              </div>
              {createdAccount.email && (
                <div className="flex justify-between items-center">
                  <span className="text-[#B8C5D6]">Email:</span>
                  <span className="text-white">{createdAccount.email}</span>
                </div>
              )}
              {createdAccount.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-[#B8C5D6]">Phone:</span>
                  <span className="text-white">{createdAccount.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#B8C5D6]">Initial Balance:</span>
                <span className="text-green-400 font-bold">{createdAccount.initialBalance} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#B8C5D6]">Password:</span>
                <span className="text-[#FFD700] font-mono font-bold">{createdAccount.tempPassword}</span>
              </div>
            </div>

            {/* Login Info */}
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
              <p className="text-blue-400 text-sm font-semibold mb-1">Login Information</p>
              <p className="text-blue-300 text-sm">Send these credentials to your player:</p>
              <div className="mt-2 text-xs text-blue-200">
                <p>Username: {createdAccount.username}</p>
                <p>Password: {createdAccount.tempPassword}</p>
                <p>Login: {createdAccount.loginUrl}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-[#FFD700] text-[#FFD700] bg-transparent"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Username: ${createdAccount.username}\nPassword: ${createdAccount.tempPassword}\nLogin: ${createdAccount.loginUrl}`,
                  )
                }
              >
                Copy Credentials
              </Button>
              <Button
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                onClick={() => setCreatedAccount(null)}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Created Players */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <CardTitle className="text-white">Recently Created Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPlayers.length === 0 ? (
              <p className="text-[#B8C5D6] text-center py-8">No players created yet</p>
            ) : (
              recentPlayers.map((player) => (
                <div
                  key={player._id}
                  className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-3 flex items-center justify-between hover:border-[#FFD700]/50 transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold">{player.fullName}</p>
                    <p className="text-[#B8C5D6] text-xs">
                      @{player.username} • {new Date(player.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-green-400 font-bold">{player.balance} ETB</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
