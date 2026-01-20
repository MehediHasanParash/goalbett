"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { DollarSign, Globe, Lock, GitBranch, Settings } from "lucide-react"
import { FinancialSettings } from "../dashboard/financial-settings"
import { PosMasking } from "../dashboard/pos-masking"
import { CurrencySettings } from "@/components/i18n/currency-settings"
import { AgentControls } from "../dashboard/agent-controls"
import { MatchRouting } from "../dashboard/match-routing"

export function AdminControlsSettings() {
  const [activeTab, setActiveTab] = useState("financial")

  const tabs = [
    { id: "financial", label: "Financial Controls", icon: DollarSign },
    { id: "currency", label: "Currency & Language", icon: Globe },
    { id: "pos-masking", label: "POS Masking", icon: Lock },
    { id: "match-routing", label: "Match Routing", icon: GitBranch },
    { id: "agent", label: "Agent Controls", icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Administrative Controls</h2>
        <p className="text-muted-foreground">Manage platform-wide settings and controls</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 border-b border-[#2A3F55]">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#FFD700] text-[#FFD700]"
                  : "border-transparent text-[#B8C5D6] hover:text-[#F5F5F5]"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "financial" ? (
        <FinancialSettings />
      ) : activeTab === "currency" ? (
        <CurrencySettings />
      ) : activeTab === "pos-masking" ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Point of Sale Masking</h2>
            <p className="text-muted-foreground">Configure privacy settings for specific regions</p>
          </div>
          <PosMasking />
          <Card3D>
            <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-green-500/20">
              <h3 className="font-bold mb-2">What is POS Masking?</h3>
              <p className="text-sm text-muted-foreground">
                POS (Point of Sale) Masking is a privacy feature that conceals personal information in betting terminals
                located in countries that require enhanced data protection. This ensures compliance with local
                regulations and protects your privacy.
              </p>
            </div>
          </Card3D>
        </div>
      ) : activeTab === "match-routing" ? (
        <MatchRouting />
      ) : (
        <AgentControls />
      )}
    </div>
  )
}
