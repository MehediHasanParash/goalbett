"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, CreditCard } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "What payment methods are available?",
    a: "We accept M-Pesa, Bank Transfer, Visa/Mastercard, and Cryptocurrency (Bitcoin, USDT). Available methods may vary by region.",
  },
  {
    q: "What is the minimum deposit?",
    a: "Minimum deposit is $10 for most payment methods. Some methods may have higher minimums.",
  },
  {
    q: "How long do deposits take?",
    a: "M-Pesa and Crypto deposits are instant. Bank transfers take 1-3 business days. Card deposits are usually instant.",
  },
  {
    q: "How do I withdraw my winnings?",
    a: "Go to Wallet > Withdraw, select your preferred method, enter the amount, and confirm. Withdrawals are processed within 24 hours.",
  },
  {
    q: "Why is my withdrawal delayed?",
    a: "First withdrawals require account verification. Large withdrawals may need additional verification. Check your email for any pending requests.",
  },
]

export default function DepositsHelpPage() {
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
            <div className="w-10 h-10 rounded-full bg-[#EC4899]/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#EC4899]" />
            </div>
            <h1 className="text-xl font-bold">Deposits & Withdrawals</h1>
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
