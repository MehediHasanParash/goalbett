"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, Database, Cpu, HardDrive, RefreshCw, Activity } from "lucide-react"

export default function SystemPage() {
  const services = [
    { name: "API Server", status: "Online", uptime: "99.9%", latency: "12ms" },
    { name: "Database", status: "Online", uptime: "99.8%", latency: "8ms" },
    { name: "Cache Layer", status: "Online", uptime: "99.95%", latency: "2ms" },
    { name: "Message Queue", status: "Online", uptime: "99.9%", latency: "5ms" },
    { name: "Odds Feed", status: "Online", uptime: "99.7%", latency: "45ms" },
    { name: "Payment Gateway", status: "Online", uptime: "99.99%", latency: "120ms" },
  ]

  return (
    <SuperAdminLayout title="System Status" description="Monitor system health and infrastructure">
      <div className="space-y-6">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">System Status</p>
                <p className="text-xl font-bold text-green-400">All Operational</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Cpu className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">CPU Usage</p>
                <p className="text-xl font-bold text-[#F5F5F5]">34%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <HardDrive className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Memory Usage</p>
                <p className="text-xl font-bold text-[#F5F5F5]">62%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#FFD700]/20">
                <Database className="h-6 w-6 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">DB Connections</p>
                <p className="text-xl font-bold text-[#F5F5F5]">127/500</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#FFD700]">Service Status</CardTitle>
            <Button variant="outline" size="sm" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, idx) => (
                <div key={idx} className="bg-[#1A2F45] border border-[#2A3F55] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-[#FFD700]" />
                      <h3 className="font-bold text-[#F5F5F5]">{service.name}</h3>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">{service.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[#B8C5D6]">Uptime</p>
                      <p className="text-[#FFD700] font-medium">{service.uptime}</p>
                    </div>
                    <div>
                      <p className="text-[#B8C5D6]">Latency</p>
                      <p className="text-[#F5F5F5] font-medium">{service.latency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
