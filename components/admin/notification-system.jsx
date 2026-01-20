"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { Bell, AlertTriangle, CheckCircle, X } from "lucide-react"

export function NotificationSystem() {
  const [notifications, setNotifications] = useState([])
  const [betSlipTracking, setBetSlipTracking] = useState({})

  useEffect(() => {
    // Simulated bet slip monitoring
    const checkBetSlips = () => {
      // In production, this would connect to your backend
      const mockBetSlips = [
        { id: "SLIP001", games: 20, timesPlayed: 5, lastPlayed: new Date() },
        { id: "SLIP002", games: 15, timesPlayed: 3, lastPlayed: new Date() },
      ]

      mockBetSlips.forEach((slip) => {
        if (slip.timesPlayed > 4 && !notifications.find((n) => n.slipId === slip.id)) {
          addNotification({
            id: Date.now(),
            slipId: slip.id,
            type: "warning",
            title: "Repeated Bet Slip Alert",
            message: `Bet slip ${slip.id} with ${slip.games} games has been played ${slip.timesPlayed} times`,
            timestamp: new Date(),
          })
        }
      })
    }

    const interval = setInterval(checkBetSlips, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [notifications])

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev])
  }

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <Card3D>
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {notifications.length} active notification{notifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <BrandedButton variant="secondary" size="sm" onClick={clearAllNotifications}>
              Clear All
            </BrandedButton>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-muted-foreground">No notifications at this time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-[#1A2F45] border-l-4 border-orange-500 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.timestamp.toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-[#1A2F45] rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Notification Settings</h4>
          <p className="text-xs text-muted-foreground">
            You will be notified when a bet slip with the same games is played more than 4 times. This helps monitor
            repeated betting patterns.
          </p>
        </div>
      </div>
    </Card3D>
  )
}
