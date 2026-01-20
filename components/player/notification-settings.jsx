"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { Bell, Mail, Smartphone, Trophy, DollarSign, Gift, AlertCircle, Save } from "lucide-react"

export function NotificationSettings() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [notifications, setNotifications] = useState({
    email: {
      promotions: true,
      betResults: true,
      deposits: true,
      withdrawals: true,
      newsletter: false,
    },
    push: {
      promotions: true,
      betResults: true,
      deposits: true,
      withdrawals: true,
      liveMatches: true,
    },
    sms: {
      deposits: true,
      withdrawals: true,
      securityAlerts: true,
    },
  })

  const toggleNotification = (category, type) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch("/api/player/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Notification preferences saved!" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save preferences" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const Toggle = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        enabled ? "bg-[#FFD700]" : "bg-[#2A3F55]"
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  )

  const NotificationItem = ({ icon: Icon, label, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#2A3F55] last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-6 pt-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
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

      {/* Email Notifications */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
          </div>

          <div className="space-y-1">
            <NotificationItem
              icon={Gift}
              label="Promotions & Bonuses"
              description="Get notified about new offers and bonuses"
              enabled={notifications.email.promotions}
              onToggle={() => toggleNotification("email", "promotions")}
            />
            <NotificationItem
              icon={Trophy}
              label="Bet Results"
              description="Receive results of your bets"
              enabled={notifications.email.betResults}
              onToggle={() => toggleNotification("email", "betResults")}
            />
            <NotificationItem
              icon={DollarSign}
              label="Deposits"
              description="Confirmation of deposits"
              enabled={notifications.email.deposits}
              onToggle={() => toggleNotification("email", "deposits")}
            />
            <NotificationItem
              icon={DollarSign}
              label="Withdrawals"
              description="Confirmation of withdrawals"
              enabled={notifications.email.withdrawals}
              onToggle={() => toggleNotification("email", "withdrawals")}
            />
            <NotificationItem
              icon={Mail}
              label="Newsletter"
              description="Weekly newsletter with tips and news"
              enabled={notifications.email.newsletter}
              onToggle={() => toggleNotification("email", "newsletter")}
            />
          </div>
        </div>
      </Card3D>

      {/* Push Notifications */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">Receive instant push notifications</p>
            </div>
          </div>

          <div className="space-y-1">
            <NotificationItem
              icon={Gift}
              label="Promotions & Bonuses"
              description="Instant alerts for new offers"
              enabled={notifications.push.promotions}
              onToggle={() => toggleNotification("push", "promotions")}
            />
            <NotificationItem
              icon={Trophy}
              label="Bet Results"
              description="Instant bet result notifications"
              enabled={notifications.push.betResults}
              onToggle={() => toggleNotification("push", "betResults")}
            />
            <NotificationItem
              icon={DollarSign}
              label="Deposits & Withdrawals"
              description="Transaction confirmations"
              enabled={notifications.push.deposits}
              onToggle={() => toggleNotification("push", "deposits")}
            />
            <NotificationItem
              icon={Trophy}
              label="Live Match Updates"
              description="Score updates for your bets"
              enabled={notifications.push.liveMatches}
              onToggle={() => toggleNotification("push", "liveMatches")}
            />
          </div>
        </div>
      </Card3D>

      {/* SMS Notifications */}
      <Card3D className="mb-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">SMS Notifications</h3>
              <p className="text-sm text-muted-foreground">Important alerts via SMS</p>
            </div>
          </div>

          <div className="space-y-1">
            <NotificationItem
              icon={DollarSign}
              label="Deposits"
              description="SMS confirmation for deposits"
              enabled={notifications.sms.deposits}
              onToggle={() => toggleNotification("sms", "deposits")}
            />
            <NotificationItem
              icon={DollarSign}
              label="Withdrawals"
              description="SMS confirmation for withdrawals"
              enabled={notifications.sms.withdrawals}
              onToggle={() => toggleNotification("sms", "withdrawals")}
            />
            <NotificationItem
              icon={AlertCircle}
              label="Security Alerts"
              description="Critical security notifications"
              enabled={notifications.sms.securityAlerts}
              onToggle={() => toggleNotification("sms", "securityAlerts")}
            />
          </div>
        </div>
      </Card3D>

      {/* Save Button */}
      <BrandedButton onClick={handleSave} variant="primary" disabled={loading} className="w-full">
        {loading ? (
          "Saving..."
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </BrandedButton>
    </div>
  )
}
