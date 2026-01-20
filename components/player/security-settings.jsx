"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { Lock, Eye, EyeOff, Shield, Smartphone, Key, AlertTriangle } from "lucide-react"

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/player/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change password" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const inputClasses =
    "w-full bg-[#0A1A2F] border border-[#2A3F55] rounded-lg px-4 py-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD700] transition-colors pr-12"

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" }
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

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-6 pt-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account security and password</p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-center ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500 text-green-400"
              : "bg-red-500/20 border border-red-500 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Change Password */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Change Password</h3>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={inputClasses}
                  placeholder="Enter current password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={inputClasses}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength.strength ? passwordStrength.color : "bg-[#2A3F55]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength: <span className={`font-medium`}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={inputClasses}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <BrandedButton type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </BrandedButton>
          </form>
        </div>
      </Card3D>

      {/* Two-Factor Authentication */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">Coming Soon</div>
          </div>
        </div>
      </Card3D>

      {/* Active Sessions */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-xs text-muted-foreground">This device - Active now</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">Active</span>
            </div>
          </div>

          <BrandedButton variant="secondary" className="w-full mt-4">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Sign Out All Other Sessions
          </BrandedButton>
        </div>
      </Card3D>

      {/* Security Tips */}
      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <h3 className="font-bold mb-4">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#FFD700]">•</span>
              Use a strong, unique password with at least 8 characters
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFD700]">•</span>
              Include uppercase, lowercase, numbers, and special characters
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFD700]">•</span>
              Never share your password or login credentials with anyone
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFD700]">•</span>
              Enable two-factor authentication when available
            </li>
          </ul>
        </div>
      </Card3D>
    </div>
  )
}
