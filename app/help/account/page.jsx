"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "How do I create an account?",
    a: "Click 'Register' and fill in your details including email, password, and personal information. Verify your email to complete registration.",
  },
  {
    q: "I forgot my password",
    a: "Click 'Forgot Password' on the login page. Enter your email and follow the reset link sent to your inbox.",
  },
  {
    q: "How do I verify my account?",
    a: "Go to Settings > Verification. Upload a valid ID (passport/national ID) and proof of address. Verification takes 24-48 hours.",
  },
  {
    q: "Why is my account restricted?",
    a: "Accounts may be restricted for security reasons, incomplete verification, or suspicious activity. Contact support for details.",
  },
  {
    q: "How do I close my account?",
    a: "Contact support to request account closure. You'll need to withdraw any remaining balance first.",
  },
]

export default function AccountHelpPage() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      <BettingHeader />
      <main className="container mx-auto px-4 py-36 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/help" className="p-2 hover:bg-[#1A2F45] rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
              <User className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h1 className="text-xl font-bold">My Account & Verification</h1>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-[#1A2F45]/80 border-[#2A3F55] overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="font-medium pr-4">{faq.q}</span>
                {expanded === index ? (
                  <ChevronUp className="w-5 h-5 text-[#B8C5D6] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#B8C5D6] flex-shrink-0" />
                )}
              </button>
              {expanded === index && (
                <div className="px-4 pb-4 text-sm text-[#B8C5D6] border-t border-[#2A3F55] pt-3">{faq.a}</div>
              )}
            </Card>
          ))}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
