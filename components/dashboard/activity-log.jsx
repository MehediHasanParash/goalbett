"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, UserPlus, UserMinus, DollarSign, Settings, Shield, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap = {
  UserPlus,
  UserMinus,
  DollarSign,
  Settings,
  Shield,
  AlertCircle,
}

export function ActivityLog() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/dashboard/live-feed", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success && data.activityLog) {
        setActivities(data.activityLog)
      }
    } catch (error) {
      console.error("Error fetching activity log:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    // Refresh every 60 seconds
    const interval = setInterval(fetchActivities, 60000)
    return () => clearInterval(interval)
  }, [])

  const getTypeBadge = (type) => {
    const colors = {
      user: "bg-green-500/20 text-green-400 border-green-500/50",
      transaction: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      security: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      alert: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      settings: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/50",
    }
    return colors[type] || colors.settings
  }

  const getIcon = (iconName) => {
    return iconMap[iconName] || Settings
  }

  return (
    <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFD700]" />
            Activity Log
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActivities}
            disabled={loading}
            className="text-[#B8C5D6] hover:text-[#FFD700]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading && activities.length === 0 ? (
            <div className="text-center py-8 text-[#B8C5D6]">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-[#B8C5D6]">No recent activity</div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getIcon(activity.icon)
              return (
                <div
                  key={activity.id}
                  className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1 ${activity.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[#F5F5F5] font-semibold text-sm">{activity.action}</p>
                        <Badge className={getTypeBadge(activity.type)}>{activity.type}</Badge>
                      </div>
                      <p className="text-[#B8C5D6] text-xs mb-1">By: {activity.user}</p>
                      {activity.details && <p className="text-[#FFD700] text-xs">{activity.details}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#B8C5D6] text-xs">{activity.time}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
