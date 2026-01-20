"use client"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Users, Briefcase, Shield, Zap, UserCog, UserCheck } from "lucide-react"

export default function SelectRolePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-2">Choose Your Role</h1>
          <p className="text-[#B8C5D6]">Select how you want to access Goal-Bett</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Player Role */}
          <Link href="/auth?role=player">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Player</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">Place bets, enjoy casino games, and manage your account</p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>

          {/* Agent Role */}
          <Link href="/auth?role=agent">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Agent</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">Accept cash bets, manage transactions, and earn commissions</p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>

          <Link href="/sa/login">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Sub-Agent</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">
                Work under agent, create players, and manage betting operations
              </p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>

          <Link href="/admin/login">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <UserCog className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Admin</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">Manage players, agents, approvals, and daily operations</p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>

          {/* Tenant Admin Role */}
          <Link href="/t/login">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Tenant/Operator</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">Run your casino, manage network, and control operations</p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>

          {/* Super Admin Role */}
          <Link href="/s/login">
            <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-2xl p-8 hover:border-[#FFD700] transition-all duration-300 cursor-pointer group">
              <div className="bg-[#1A2F45] w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FFD700] group-hover:text-[#0A1A2F] transition-colors">
                <Zap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Super Admin</h2>
              <p className="text-[#B8C5D6] mb-4 text-sm">
                Full platform control, games, providers, and system management
              </p>
              <div className="text-[#FFD700] text-sm font-semibold">Get Started →</div>
            </div>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
