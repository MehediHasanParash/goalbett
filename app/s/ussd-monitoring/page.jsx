"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const sessionData = [
  { time: "00:00", sessions: 12, messages: 45 },
  { time: "04:00", sessions: 8, messages: 32 },
  { time: "08:00", sessions: 45, messages: 156 },
  { time: "12:00", sessions: 78, messages: 289 },
  { time: "16:00", sessions: 65, messages: 234 },
  { time: "20:00", sessions: 52, messages: 178 },
]

export default function UssdMonitoringPage() {
  return (
    <SuperAdminLayout title="USSD / SMS Monitoring" description="Monitor active sessions and SMS messages">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Sessions", value: "45", icon: Activity, color: "text-[#FFD700]" },
            { label: "Today Messages", value: "1,234", icon: MessageSquare, color: "text-blue-400" },
            { label: "Success Rate", value: "98.5%", icon: CheckCircle, color: "text-green-400" },
            { label: "Failed", value: "12", icon: AlertCircle, color: "text-red-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#FFD700]/20">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Sessions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3F55" />
                <XAxis dataKey="time" stroke="#B8C5D6" />
                <YAxis stroke="#B8C5D6" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0A1A2F", border: "1px solid #2A3F55" }}
                  labelStyle={{ color: "#FFD700" }}
                />
                <Line type="monotone" dataKey="sessions" stroke="#FFD700" strokeWidth={2} />
                <Line type="monotone" dataKey="messages" stroke="#4A90E2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
