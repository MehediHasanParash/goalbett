"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export function PasswordChangeCard({ title = "Change Password", description = "Update your account password" }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "bg-gray-500" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const levels = [
      { label: "Very Weak", color: "bg-red-500" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Fair", color: "bg-yellow-500" },
      { label: "Good", color: "bg-blue-500" },
      { label: "Strong", color: "bg-green-500" },
    ]

    return { strength, ...levels[Math.min(strength, 4)] }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      setLoading(false)
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" })
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change password" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#0D1F35] border-[#2A3F55]">
      <CardHeader>
        <CardTitle className="text-[#FFD700] flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-[#B8C5D6]">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500 text-green-400"
                : "bg-red-500/20 border border-red-500 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">Current Password</Label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-white"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">New Password</Label>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white pr-10"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-white"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i < passwordStrength.strength ? passwordStrength.color : "bg-[#2A3F55]"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#B8C5D6]">
                  Strength: <span className="font-medium">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#B8C5D6]">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-[#1A2F45] border-[#2A3F55] text-white pr-10"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8C5D6] hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-[#1A2F45]/50 rounded-lg border border-[#2A3F55]">
          <h4 className="text-sm font-semibold text-[#FFD700] mb-2">Password Tips</h4>
          <ul className="text-xs text-[#B8C5D6] space-y-1">
            <li>• Use at least 8 characters</li>
            <li>• Include uppercase and lowercase letters</li>
            <li>• Add numbers and special characters</li>
            <li>• Don't reuse passwords from other accounts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
