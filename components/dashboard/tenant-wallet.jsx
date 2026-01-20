"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Users, TrendingUp } from "lucide-react"
import { AdminAgentTopup } from "@/components/admin/admin-agent-topup"

export function TenantWallet() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#F5F5F5] text-sm mb-2">Total Agents</p>
                <p className="text-3xl font-bold text-white">78</p>
              </div>
              <Users className="w-10 h-10 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#F5F5F5] text-sm mb-2">Total Float Distributed</p>
                <p className="text-3xl font-bold text-green-400">$150,000</p>
              </div>
              <Wallet className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#F5F5F5] text-sm mb-2">This Month</p>
                <p className="text-3xl font-bold text-blue-400">$25,000</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Agent Topup */}
      <AdminAgentTopup />

      {/* Info Section */}
      <Card className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/30">
        <CardContent className="p-6 space-y-3 text-[#B8C5D6] text-sm">
          <div>
            <h4 className="text-[#FFD700] font-semibold mb-1">Funding Types:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Cash Deposit:</strong> Agent brings physical cash (requires receipt photo + witnesses)
              </li>
              <li>
                <strong>Bank Transfer:</strong> Agent transfers via bank (requires bank reference)
              </li>
              <li>
                <strong>Mobile Money:</strong> Agent uses M-Pesa, Orange Money, etc.
              </li>
              <li>
                <strong>Credit Line:</strong> System credit to trusted agents
              </li>
            </ul>
          </div>
          <div className="p-3 bg-[#0A1A2F]/50 rounded border border-[#FFD700]/20">
            <p className="text-xs text-[#FFD700]">
              ⚠️ Important: Amounts over $100,000 require manual review and approval
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
