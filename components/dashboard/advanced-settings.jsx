"use client"
import { useState } from "react"
import { FinancialSettings } from "./financial-settings"
import { PosMasking } from "./pos-masking"
import { CurrencySettings } from "@/components/i18n/currency-settings"
import { Settings, DollarSign, Globe, Lock, AlertCircle } from "lucide-react"
import { Card3D } from "@/components/ui/3d-card"

export function AdvancedSettings() {
  const [activeTab, setActiveTab] = useState("financial")

  const tabs = [
    { id: "financial", label: "Financial Controls", icon: DollarSign },
    { id: "currency", label: "Currency & Language", icon: Globe },
    { id: "pos-masking", label: "POS Masking", icon: Lock },
    { id: "security", label: "Security", icon: AlertCircle },
  ]

  return (
    <div className="pb-20 px-4 sm:px-6 pt-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-[#FFD700]" />
          <h1 className="text-3xl font-bold">Advanced Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage all your betting controls and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-4 border-b border-[#2A3F55]">
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
      <div className="animate-fade-in">
        {activeTab === "financial" && <FinancialSettings />}
        {activeTab === "currency" && <CurrencySettings />}
        {activeTab === "pos-masking" && (
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
                  POS (Point of Sale) Masking is a privacy feature that conceals personal information in betting
                  terminals located in countries that require enhanced data protection. This ensures compliance with
                  local regulations and protects your privacy.
                </p>
              </div>
            </Card3D>
          </div>
        )}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Security Settings</h2>
              <p className="text-muted-foreground">Manage your account security and privacy</p>
            </div>
            <Card3D>
              <div className="glass p-6 rounded-2xl">
                <h3 className="font-bold mb-4">Account Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <div>
                      <p className="font-semibold text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground mt-1">Protect your account with 2FA</p>
                    </div>
                    <button className="px-4 py-2 bg-[#FFD700] text-[#0A1A2F] rounded font-bold text-sm hover:bg-[#FFD700]/90">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <div>
                      <p className="font-semibold text-sm">Password Change</p>
                      <p className="text-xs text-muted-foreground mt-1">Update your account password</p>
                    </div>
                    <button className="px-4 py-2 bg-[#FFD700] text-[#0A1A2F] rounded font-bold text-sm hover:bg-[#FFD700]/90">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                    <div>
                      <p className="font-semibold text-sm">Session Timeout</p>
                      <p className="text-xs text-muted-foreground mt-1">Automatically logout after inactivity</p>
                    </div>
                    <select className="px-4 py-2 bg-[#0A1A2F] border border-[#2A3F55] rounded focus:outline-none focus:border-[#FFD700] text-sm">
                      <option>30 min</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>
        )}
      </div>
    </div>
  )
}
