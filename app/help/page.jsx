"use client"
import { useState } from "react"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Gift,
  Info,
  Settings,
  Trophy,
  User,
  CreditCard,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { ChatBot } from "@/components/support/chat-bot"
import { useLanguage } from "@/lib/i18n/language-context"
import { useTenant } from "@/components/providers/tenant-provider"
import { useThemeColors } from "@/hooks/useThemeColors"

export default function HelpPage() {
  const [showChatBot, setShowChatBot] = useState(false)
  const { t } = useLanguage()
  const { brandName, supportEmail, supportPhone } = useTenant()
  const { colors } = useThemeColors()

  const email = supportEmail || `support@${brandName?.toLowerCase().replace(/\s+/g, "") || "goalbett"}.com`
  const phone = supportPhone || "+46739905688"

  const contactOptions = [
    {
      id: "chat",
      label: "Live Chat",
      action: () => setShowChatBot(true),
      primary: true,
    },
    {
      id: "email",
      label: email,
      href: `mailto:${email}`,
    },
    {
      id: "whatsapp",
      label: phone,
      href: `https://wa.me/${phone.replace(/[^0-9]/g, "")}`,
    },
  ]

  const primaryColor = colors.accent || "#FFD700"
  const primaryTextColor = colors.accentForeground || "#0a1a2f"

  const helpCategories = [
    {
      id: "bonuses",
      title: "Bonuses & Promotions",
      icon: Gift,
      color: primaryColor,
      href: "/help/bonuses",
    },
    {
      id: "general",
      title: "General",
      icon: Info,
      color: primaryColor,
      href: "/help/general",
    },
    {
      id: "technical",
      title: "Technical",
      icon: Settings,
      color: primaryColor,
      href: "/help/technical",
    },
    {
      id: "sportsbook",
      title: "Sportsbook",
      icon: Trophy,
      color: primaryColor,
      href: "/help/sportsbook",
    },
    {
      id: "account",
      title: "My Account & Verification",
      icon: User,
      color: primaryColor,
      href: "/help/account",
    },
    {
      id: "deposits",
      title: "Deposits & Withdrawals",
      icon: CreditCard,
      color: primaryColor,
      href: "/help/deposits",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <BettingHeader />

      <main className="container mx-auto px-4 py-36">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground text-sm">
            Our customer support is available 24/7 via live chat and phone. Call us at {phone}.
          </p>
        </div>

        {/* Contact Buttons */}
        <div className="space-y-3 mb-8">
          {contactOptions.map((option) =>
            option.action ? (
              <button
                key={option.id}
                onClick={option.action}
                className="w-full p-4 rounded-xl font-semibold text-center transition-all hover:opacity-90"
                style={{
                  backgroundColor: option.primary ? primaryColor : "var(--card)",
                  color: option.primary ? primaryTextColor : "var(--foreground)",
                  border: option.primary ? "none" : "1px solid var(--border)",
                }}
              >
                {option.label}
              </button>
            ) : (
              <a
                key={option.id}
                href={option.href}
                target={option.href?.startsWith("https") ? "_blank" : undefined}
                rel={option.href?.startsWith("https") ? "noopener noreferrer" : undefined}
                className="block w-full p-4 rounded-xl font-semibold text-center transition-all"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  border: `1px solid var(--border)`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {option.label}
              </a>
            ),
          )}
        </div>

        {/* Help Categories Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {helpCategories.map((category) => (
            <Link key={category.id} href={category.href} className="block">
              <Card
                className="p-6 h-full hover:scale-[1.02] transition-all cursor-pointer border-border hover:border-opacity-100"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderColor: `${category.color}30`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <category.icon className="w-6 h-6" style={{ color: category.color }} />
                </div>
                <h3 className="font-bold text-sm leading-tight text-foreground">{category.title}</h3>
              </Card>
            </Link>
          ))}
        </div>

        {/* Support Info Cards */}
        <div className="space-y-4">
          {/* Email Support */}
          <Card className="bg-card border-border p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Mail className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Email Support</h3>
                <p className="text-sm mb-2" style={{ color: primaryColor }}>
                  {email}
                </p>
                <p className="text-muted-foreground text-sm">
                  For general inquiries and non-urgent issues. Response within 24 hours.
                </p>
              </div>
            </div>
          </Card>

          {/* Live Chat */}
          <Card className="bg-card border-border p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <MessageCircle className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Live Chat</h3>
                </div>
                <p className="text-green-400 text-sm mb-2">Available Now</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Chat with our support team in real-time for immediate assistance.
                </p>
                <Button
                  onClick={() => setShowChatBot(true)}
                  className="w-full font-bold"
                  style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                >
                  Start Live Chat
                </Button>
              </div>
            </div>
          </Card>

          {/* WhatsApp */}
          <Card className="bg-card border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">WhatsApp</h3>
                <p className="text-[#25D366] text-sm mb-2">{phone}</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Message us on WhatsApp for quick support and assistance.
                </p>
                <a
                  href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold">Open WhatsApp</Button>
                </a>
              </div>
            </div>
          </Card>

          {/* Support Hours */}
          <Card className="bg-card border-border p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Clock className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Support Hours</h3>
                <p className="text-sm mb-2" style={{ color: primaryColor }}>
                  24/7 Support Available
                </p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Live Chat & WhatsApp</span>
                    <span className="text-foreground">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Support</span>
                    <span className="text-foreground">24h response</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNavigation />

      {/* ChatBot Modal */}
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}
    </div>
  )
}
