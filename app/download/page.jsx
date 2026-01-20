"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  Chrome,
  Share2,
  Copy,
  Check,
  Shield,
  Zap,
  Bell,
  WifiOff,
  AlertCircle,
  Users,
  Building2,
  UserCog,
  UserCheck,
  Settings,
  Gamepad2,
} from "lucide-react"
import { usePWA } from "@/components/pwa/pwa-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const APP_VARIANTS = [
  {
    id: "player",
    name: "GoalBett Player",
    description: "For players - Sports betting and casino games",
    url: "/",
    installUrl: "https://goalbett.com/?install=true",
    externalDomain: "goalbett.com",
    manifestUrl: "/manifest-player.json",
    color: "#EAB308",
    bgGradient: "from-yellow-500 to-amber-600",
    icon: Gamepad2,
    features: ["Live betting", "Casino games", "Quick withdrawals", "Push notifications"],
  },
  {
    id: "super-admin",
    name: "Super Admin Panel",
    description: "For platform administrators",
    url: "/s/dashboard",
    installUrl: "https://betengin.com/?install=true",
    externalDomain: "betengin.com",
    manifestUrl: "/manifest-super-admin.json",
    color: "#6366F1",
    bgGradient: "from-indigo-500 to-purple-600",
    icon: Shield,
    features: ["Platform management", "Tenant oversight", "Analytics", "System config"],
  },
  {
    id: "tenant",
    name: "Tenant Admin Portal",
    description: "For tenant operators",
    url: "/t/login",
    installUrl: "https://tenantbetengin.com/?install=true",
    externalDomain: "tenantbetengin.com",
    manifestUrl: "/manifest-tenant.json",
    color: "#10B981",
    bgGradient: "from-emerald-500 to-teal-600",
    icon: Building2,
    features: ["User management", "Financial reports", "Agent control", "Settings"],
  },
  {
    id: "agent",
    name: "Agent Portal",
    description: "For agents",
    url: "/a/login",
    installUrl: "https://agentbetengin.com/?install=true",
    externalDomain: "agentbetengin.com",
    manifestUrl: "/manifest-agent.json",
    color: "#8B5CF6",
    bgGradient: "from-purple-500 to-violet-600",
    icon: Users,
    features: ["Player registration", "Transactions", "Commission tracking", "Reports"],
  },
  // {
  //   id: "subagent",
  //   name: "Sub-Agent Portal",
  //   description: "For sub-agents",
  //   url: "/sa/login",
  //   installUrl: "/sa/login?install=true",
  //   manifestUrl: "/manifest-subagent.json",
  //   color: "#F59E0B",
  //   bgGradient: "from-amber-500 to-orange-600",
  //   icon: UserCheck,
  //   features: ["Player management", "Deposits", "Withdrawals", "Reports"],
  // },
  // {
  //   id: "admin",
  //   name: "Admin Panel",
  //   description: "For tenant admins",
  //   url: "/admin/login",
  //   installUrl: "/admin/login?install=true",
  //   manifestUrl: "/manifest-admin.json",
  //   color: "#EF4444",
  //   bgGradient: "from-red-500 to-rose-600",
  //   icon: Settings,
  //   features: ["User management", "Settings", "Reports", "Configurations"],
  // },
  // {
  //   id: "staff",
  //   name: "Staff Portal",
  //   description: "For staff members",
  //   url: "/staff/login",
  //   installUrl: "/staff/login?install=true",
  //   manifestUrl: "/manifest-staff.json",
  //   color: "#EC4899",
  //   bgGradient: "from-pink-500 to-rose-600",
  //   icon: UserCog,
  //   features: ["Player support", "Transactions", "Reports", "Tasks"],
  // },
]

// Detect user's platform
function detectPlatform() {
  if (typeof window === "undefined") return "unknown"

  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ""

  if (/iphone|ipad|ipod/.test(ua) || (platform === "macintel" && navigator.maxTouchPoints > 1)) {
    return "ios"
  }
  if (/android/.test(ua)) {
    return "android"
  }
  if (/macintosh|mac os x/.test(ua)) {
    return "mac"
  }
  if (/win/.test(platform)) {
    return "windows"
  }
  if (/linux/.test(platform)) {
    return "linux"
  }
  return "unknown"
}

// Check if running in standalone mode (already installed)
function isStandalone() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}

export default function DownloadPage() {
  const { isInstallable, triggerInstall, isInstalled } = usePWA()
  const [platform, setPlatform] = useState("unknown")
  const [copiedUrl, setCopiedUrl] = useState(null)
  const [selectedApp, setSelectedApp] = useState(null)
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setIsAlreadyInstalled(isStandalone())
  }, [])

  const copyToClipboard = async (url, id) => {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(id)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleInstall = async (app) => {
    setSelectedApp(app.id)
    // Navigate to the app's install URL (external domain)
    window.location.href = app.installUrl
  }

  const shareApp = async (app) => {
    const fullUrl = app.externalDomain ? `https://${app.externalDomain}` : `${window.location.origin}${app.url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Download ${app.name}`,
          text: `${app.description} - Install now!`,
          url: fullUrl,
        })
      } catch (err) {
        if (err.name !== "AbortError") {
          copyToClipboard(fullUrl, app.id)
        }
      }
    } else {
      copyToClipboard(fullUrl, app.id)
    }
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case "ios":
        return <Apple className="h-5 w-5" />
      case "android":
        return <Smartphone className="h-5 w-5" />
      case "mac":
        return <Apple className="h-5 w-5" />
      case "windows":
        return <Monitor className="h-5 w-5" />
      default:
        return <Chrome className="h-5 w-5" />
    }
  }

  const getPlatformName = () => {
    switch (platform) {
      case "ios":
        return "iPhone/iPad"
      case "android":
        return "Android"
      case "mac":
        return "Mac"
      case "windows":
        return "Windows"
      case "linux":
        return "Linux"
      default:
        return "Your Device"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full text-sm font-medium">
            {getPlatformIcon()}
            Detected: {getPlatformName()}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">Download Our Apps</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Each app installs separately with its own icon. Install only the apps you need!
          </p>
        </div>

        {/* Already Installed Notice */}
        {isAlreadyInstalled && (
          <Alert className="bg-green-500/20 border-green-500/50 max-w-2xl mx-auto">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">App Already Installed</AlertTitle>
            <AlertDescription className="text-green-200">
              You are running an installed version. You can still install other app variants.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-500/20 border-blue-500/50 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-400">Separate Apps</AlertTitle>
          <AlertDescription className="text-blue-200">
            Each portal (Player, Tenant, Agent, etc.) installs as a separate app with its own icon. They do not
            interfere with each other.
          </AlertDescription>
        </Alert>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Zap, label: "Lightning Fast", desc: "Instant load times" },
            { icon: WifiOff, label: "Works Offline", desc: "No internet needed" },
            { icon: Bell, label: "Notifications", desc: "Stay updated" },
            { icon: Shield, label: "Secure", desc: "Bank-level security" },
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <feature.icon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-sm">{feature.label}</h3>
              <p className="text-xs text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* App Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {APP_VARIANTS.map((app) => {
            const IconComponent = app.icon
            return (
              <Card
                key={app.id}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 overflow-hidden hover:border-white/20 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.bgGradient} flex items-center justify-center`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg mt-3">{app.name}</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">{app.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Features */}
                  <div className="space-y-1">
                    {app.features.slice(0, 2).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => shareApp(app)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/20 hover:bg-white/10 text-white h-9"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(app.installUrl, app.id)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 hover:bg-white/10 text-white h-9 px-2"
                    >
                      {copiedUrl === app.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={() => handleInstall(app)}
                      size="sm"
                      className={`flex-1 bg-gradient-to-r ${app.bgGradient} text-white hover:opacity-90 h-9`}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Platform-Specific Instructions */}
        <Card className="bg-white/5 border-white/10 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-yellow-500" />
              Installation Guide for {getPlatformName()}
            </CardTitle>
            <CardDescription>Follow these simple steps to install any app</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={platform === "ios" ? "ios" : platform === "android" ? "android" : "desktop"}
              className="w-full"
            >
              <TabsList className="bg-black/30 border border-white/10 grid grid-cols-3">
                <TabsTrigger value="android" className="data-[state=active]:bg-white/10 text-white">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Android
                </TabsTrigger>
                <TabsTrigger value="ios" className="data-[state=active]:bg-white/10 text-white">
                  <Apple className="h-4 w-4 mr-2" />
                  iOS
                </TabsTrigger>
                <TabsTrigger value="desktop" className="data-[state=active]:bg-white/10 text-white">
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </TabsTrigger>
              </TabsList>

              <TabsContent value="android" className="mt-6 space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5" /> Easiest Method
                  </h4>
                  <p className="text-gray-300 text-sm">Android supports direct installation from browser!</p>
                </div>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-white">Click "Install" button on the app you want</p>
                      <p className="text-sm text-gray-400">This takes you to the app's page with correct manifest</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-white">Wait for the install banner or tap browser menu</p>
                      <p className="text-sm text-gray-400">Look for "Add to Home Screen" or "Install App" option</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-white">Done! Each app gets its own icon</p>
                      <p className="text-sm text-gray-400">Repeat for each portal you need (Tenant, Agent, etc.)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ios" className="mt-6 space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5" /> Important: Use Safari
                  </h4>
                  <p className="text-gray-300 text-sm">
                    iOS only allows installation from Safari browser, not Chrome or other browsers.
                  </p>
                </div>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-white">Click "Install" to go to the app page</p>
                      <p className="text-sm text-gray-400">Make sure you're using Safari browser</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-white">Tap the Share button</p>
                      <p className="text-sm text-gray-400">Square with arrow at the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-white">Tap "Add to Home Screen"</p>
                      <p className="text-sm text-gray-400">Scroll down in the share menu to find this</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </span>
                    <div>
                      <p className="font-medium text-white">Repeat for each app you need</p>
                      <p className="text-sm text-gray-400">Each portal installs as a separate app</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="desktop" className="mt-6 space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-purple-400 font-semibold flex items-center gap-2 mb-2">
                    <Chrome className="h-5 w-5" /> Works on Chrome, Edge, Brave
                  </h4>
                  <p className="text-gray-300 text-sm">Most modern browsers support PWA installation on desktop.</p>
                </div>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-white">Click "Install" button on the app you want</p>
                      <p className="text-sm text-gray-400">This opens the app in the current tab</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-white">Look for install icon in address bar</p>
                      <p className="text-sm text-gray-400">Or click browser menu {">"} "Install App"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-white">Confirm installation</p>
                      <p className="text-sm text-gray-400">The app will open in its own window</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Problems installing? Make sure you're using a supported browser.</p>
          <p className="mt-1">Chrome, Edge, Brave, or Safari (iOS) recommended.</p>
        </div>
      </div>
    </div>
  )
}
