"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Wallet, TrendingUp, Receipt, Plus, DollarSign, User, Eye, Trash2, LogOut } from "lucide-react"

export default function SubAgentDashboard() {
  const [subAgents] = useState([
    {
      id: 1,
      name: "Ahmed Sales",
      email: "ahmed@example.com",
      phone: "+1234567890",
      status: "active",
      createdDate: "2024-01-15",
      totalSales: "$8,450",
      commission: "$845",
      players: 24,
      onlineSince: "2 hours ago",
    },
    {
      id: 2,
      name: "Fatima Agent",
      email: "fatima@example.com",
      phone: "+1234567891",
      status: "active",
      createdDate: "2024-01-20",
      totalSales: "$6,200",
      commission: "$620",
      players: 18,
      onlineSince: "15 minutes ago",
    },
  ])

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">My Network</p>
                <p className="text-3xl font-bold text-white mt-2">2</p>
              </div>
              <Users className="w-12 h-12 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">My Commission</p>
                <p className="text-3xl font-bold text-[#FFD700] mt-2">$1,465</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">My Agent Balance</p>
                <p className="text-3xl font-bold text-white mt-2">$5,200</p>
              </div>
              <Wallet className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8C5D6] text-sm">Total Players</p>
                <p className="text-3xl font-bold text-white mt-2">42</p>
              </div>
              <User className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Request Credits
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Receipt className="mr-2 h-4 w-4" />
            View Sales
          </Button>
          <Button variant="outline" className="border-[#FFD700] text-[#FFD700] bg-transparent">
            <Wallet className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
          <Button variant="outline" className="border-[#FFD700] text-[#FFD700] bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Sub-Agents Management */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">My Agent's Sub-Agents</CardTitle>
            <Button size="sm" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
              <Plus className="mr-2 h-4 w-4" />
              View Parent Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start mb-3">
                  <div>
                    <p className="text-[#FFD700] font-semibold">{agent.name}</p>
                    <p className="text-[#B8C5D6] text-sm">{agent.email}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-xs">STATUS</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        agent.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-xs">SALES</p>
                    <p className="text-white font-bold">{agent.totalSales}</p>
                  </div>
                  <div>
                    <p className="text-[#B8C5D6] text-xs">COMMISSION</p>
                    <p className="text-[#FFD700] font-bold">{agent.commission}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#FFD700] text-[#FFD700] bg-transparent hover:bg-[#FFD700]/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-400 bg-transparent hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Report */}
      <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#FFD700]" />
            My Sales This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { day: "Monday", sales: "$450", bets: 12 },
              { day: "Tuesday", sales: "$320", bets: 8 },
              { day: "Wednesday", sales: "$580", bets: 15 },
              { day: "Thursday", sales: "$620", bets: 18 },
            ].map((day, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#1A2F45] rounded border border-[#2A3F55]"
              >
                <span className="text-[#B8C5D6]">{day.day}</span>
                <div className="text-right">
                  <p className="text-[#FFD700] font-bold">{day.sales}</p>
                  <p className="text-[#B8C5D6] text-xs">{day.bets} bets</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
