"use client"
import { Card3D } from "@/components/ui/3d-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trophy,
  Wallet,
  History,
  Gift,
  Users,
  MessageSquare,
  Star,
  Sliders,
  LayoutDashboard,
  FileText,
  Zap,
  ShoppingBag,
} from "lucide-react"
import Link from "next/link"

export function Menu() {
  const menuSections = [
    {
      title: "Main Navigation",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "text-blue-400" },
        { icon: FileText, label: "KYC Verification", href: "/dashboard/kyc-verification", color: "text-purple-400" },
        { icon: Trophy, label: "Match Details", href: "/dashboard/match-details", color: "text-yellow-400" },
        { icon: Zap, label: "Betslip", href: "/dashboard/betslip", color: "text-orange-400" },
        { icon: Trophy, label: "Jackpot", href: "/dashboard/jackpot", color: "text-red-400" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", href: "/dashboard/profile", color: "text-blue-400" },
        { icon: Wallet, label: "Wallet", href: "/dashboard/wallet", color: "text-green-400" },
        { icon: History, label: "Bet History", href: "/dashboard/history", color: "text-purple-400" },
        { icon: ShoppingBag, label: "Shop", href: "/dashboard/shop", color: "text-cyan-400" },
      ],
    },
    {
      title: "Features",
      items: [
        { icon: Gift, label: "Promotions", href: "/dashboard/promotions", color: "text-pink-400" },
        { icon: Users, label: "Refer Friends", href: "/dashboard/refer", color: "text-cyan-400" },
        { icon: Star, label: "VIP Program", href: "/dashboard/vip", color: "text-amber-400" },
        { icon: Sliders, label: "Module Settings", href: "/dashboard/settings", color: "text-indigo-400" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: MessageSquare, label: "Live Chat", href: "/dashboard/chat", color: "text-green-400" },
        { icon: HelpCircle, label: "Help Center", href: "/dashboard/help", color: "text-blue-400" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications", color: "text-orange-400" },
        { icon: Shield, label: "Security", href: "/dashboard/security", color: "text-red-400" },
      ],
    },
  ]

  return (
    <div className="pb-20 px-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-muted-foreground">Manage your account and settings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
            👨‍💼
          </div>
        </div>
      </div>

      {/* User Card */}
      <Card3D className="mb-8">
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl">👨‍💼</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">John Doe</h3>
              <p className="text-sm text-muted-foreground">john.doe@example.com</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 bg-gold/20 rounded-full text-xs font-bold text-gold">VIP Gold</div>
                <div className="px-3 py-1 bg-green-500/20 rounded-full text-xs font-bold text-green-400">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </Card3D>

      {/* Menu Sections */}
      {menuSections.map((section, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-sm font-bold text-muted-foreground mb-3 px-2">{section.title}</h3>
          <Card3D>
            <div className="glass rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <Link key={itemIndex} href={item.href}>
                  <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/50 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-card/50 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </Card3D>
        </div>
      ))}

      {/* Logout Button */}
      <AnimatedButton
        variant="glass"
        className="w-full flex items-center justify-center gap-2 text-red-400 border-red-400/50 hover:bg-red-400/10"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </AnimatedButton>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Version 1.0.0</p>
        <p className="mt-2">© 2025 Casino Royal. All rights reserved.</p>
      </div>
    </div>
  )
}
