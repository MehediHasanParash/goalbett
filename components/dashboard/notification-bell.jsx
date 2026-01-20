"use client"

import { useState } from "react"
import { Bell, X, AlertCircle, CheckCircle, TrendingUp, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "success",
      title: "Deposit Approved",
      message: "Player John Doe's deposit of $500 has been approved",
      time: "2 mins ago",
      unread: true,
    },
    {
      id: 2,
      type: "warning",
      title: "Withdrawal Pending",
      message: "Withdrawal request for $1,200 requires approval",
      time: "15 mins ago",
      unread: true,
    },
    {
      id: 3,
      type: "info",
      title: "New Agent Added",
      message: "Agent 'Sarah Smith' has been successfully added",
      time: "1 hour ago",
      unread: false,
    },
    {
      id: 4,
      type: "success",
      title: "High Roller Alert",
      message: "Player placed a bet of $5,000 on Liverpool vs Arsenal",
      time: "2 hours ago",
      unread: false,
    },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case "info":
        return <UserPlus className="w-5 h-5 text-blue-400" />
      default:
        return <TrendingUp className="w-5 h-5 text-[#FFD700]" />
    }
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-[#F5F5F5] hover:text-[#FFD700] transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
            {unreadCount}
          </Badge>
        )}
      </button>

      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#0D1F35] border border-[#2A3F55] rounded-lg shadow-2xl z-50 max-h-[32rem] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2A3F55] flex items-center justify-between sticky top-0 bg-[#0D1F35]">
              <h3 className="text-[#F5F5F5] font-bold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-[#FFD700] hover:underline">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-[#B8C5D6] hover:text-[#F5F5F5]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#B8C5D6]">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2A3F55]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        notification.unread ? "bg-[#1A2F45]" : "hover:bg-[#1A2F45]/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[#F5F5F5] font-semibold text-sm">{notification.title}</p>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-[#FFD700] rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[#B8C5D6] text-xs mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-[#B8C5D6] text-xs mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#2A3F55] bg-[#0D1F35]">
              <Button
                variant="outline"
                className="w-full border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
                size="sm"
              >
                View All Notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
