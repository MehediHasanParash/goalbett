"use client"

import { useState, useEffect } from "react"
import { Mail, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAuthToken } from "@/lib/auth-service"

export function EmailChangeCard({ title = "Update Email", description = "Change your account email address" }) {
  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        setError("Not authenticated. Please log in again.")
        return
      }
      const response = await fetch("/api/super/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success && data.user) {
        setCurrentEmail(data.user.email)
        setError("")
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.")
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err)
      setError("Failed to load profile")
    }
  }

  const handleUpdateEmail = async () => {
    setError("")
    setSuccess("")

    if (!newEmail) {
      setError("Please enter a new email address")
      return
    }

    if (!currentPassword) {
      setError("Please enter your current password to confirm changes")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address")
      return
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError("New email must be different from current email")
      return
    }

    setIsLoading(true)

    try {
      const token = getAuthToken()
      const response = await fetch("/api/super/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          currentPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Email updated successfully!")
        setCurrentEmail(newEmail)
        setNewEmail("")
        setCurrentPassword("")
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || "Failed to update email")
      }
    } catch (error) {
      setError("Failed to update email. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
      <CardHeader>
        <CardTitle className="text-[#FFD700] flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-[#B8C5D6]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <div>
          <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Current Email</label>
          <div className="w-full px-4 py-3 bg-[#1A2F45]/50 border border-[#2A3F55] text-[#B8C5D6] rounded-lg">
            {currentEmail || "Loading..."}
          </div>
          <p className="text-xs text-[#B8C5D6]/60 mt-1">
            This email is used for password recovery and important notifications
          </p>
        </div>

        <div>
          <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">New Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value)
                if (error) setError("")
              }}
              placeholder="Enter new email address"
              className="w-full pl-10 pr-4 py-3 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] placeholder:text-[#B8C5D6]/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Current Password (Required)</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                if (error) setError("")
              }}
              placeholder="Enter your current password"
              className="w-full pl-4 pr-10 py-3 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700] placeholder:text-[#B8C5D6]/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B8C5D6] hover:text-[#F5F5F5]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-[#B8C5D6]/60 mt-1">Password is required to confirm email changes</p>
        </div>

        <Button
          onClick={handleUpdateEmail}
          disabled={isLoading || !newEmail || !currentPassword}
          className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-[#0A1A2F] font-semibold py-3"
        >
          {isLoading ? "Updating..." : "Update Email"}
        </Button>
      </CardContent>
    </Card>
  )
}
