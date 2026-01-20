"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { useAuth } from "@/hooks/useAuth"
import { ModuleSettings } from "@/components/dashboard/module-settings"
import { KYCUpload } from "@/components/player/kyc-upload"
import { ProfileSettings } from "@/components/player/profile-settings"
import { SecuritySettings } from "@/components/player/security-settings"
import { NotificationSettings } from "@/components/player/notification-settings"
import { LowBandwidthToggle } from "@/components/low-bandwidth/low-bandwidth-toggle"
import { User, Shield, Bell, Settings, FileCheck, Wifi } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { isLoading: tenantLoading } = useTenant()
  const { isAuthenticated, loading } = useAuth()
  const [activeSection, setActiveSection] = useState("profile")

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [loading, isAuthenticated, router])

  if (loading || tenantLoading) return null
  if (!isAuthenticated) return null

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "connection", label: "Connection", icon: Wifi },
    { id: "general", label: "General", icon: Settings },
    { id: "kyc", label: "KYC", icon: FileCheck },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings />
      case "security":
        return <SecuritySettings />
      case "notifications":
        return <NotificationSettings />
      case "connection":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#FFD700] mb-2">Connection Settings</h2>
              <p className="text-[#B8C5D6] text-sm">Optimize your experience for slow or limited connections</p>
            </div>
            <LowBandwidthToggle variant="full" showSettings={true} />
            <div className="bg-[#0D1F35] rounded-lg border border-[#2A3F55] p-4">
              <h3 className="font-medium text-white mb-2">About Low Bandwidth Mode</h3>
              <ul className="text-sm text-[#B8C5D6] space-y-2">
                <li>• Disables animations for faster page loads</li>
                <li>• Reduces image quality to save data</li>
                <li>• Turns off auto-play videos</li>
                <li>• Removes decorative effects like shadows and blur</li>
                <li>• Automatically detected on 2G/3G connections</li>
              </ul>
            </div>
          </div>
        )
      case "general":
        return <ModuleSettings />
      case "kyc":
        return <KYCUpload />
      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] relative overflow-x-hidden">
      <BettingHeader />
      <div className="pt-28 pb-24 container mx-auto px-4">
        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 bg-[#1A2F45]/50 p-2 rounded-lg border border-[#2A3F55]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === tab.id ? "bg-[#FFD700] text-[#0A1A2F] font-bold" : "text-[#B8C5D6] hover:bg-[#0A1A2F]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
      <BottomNavigation activeTab="menu" />
    </div>
  )
}
