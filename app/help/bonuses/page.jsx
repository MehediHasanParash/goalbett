"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, Gift } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "What is the Welcome Bonus?",
    a: "New users get 100% bonus on their first deposit up to $500. Minimum deposit is $10. The bonus must be wagered 5x before withdrawal.",
  },
  {
    q: "How do I claim my bonus?",
    a: "Bonuses are automatically credited to your account after qualifying deposits. Check your Wallet for bonus balance.",
  },
  {
    q: "What is the wagering requirement?",
    a: "Most bonuses require 5x wagering on minimum odds of 1.50. This means you need to bet 5 times the bonus amount before withdrawal.",
  },
  {
    q: "Can I withdraw my bonus?",
    a: "You can withdraw bonus funds after meeting the wagering requirements. Check your bonus progress in the Wallet section.",
  },
  {
    q: "Do bonuses expire?",
    a: "Yes, most bonuses expire after 30 days if wagering requirements are not met. Check specific bonus terms for details.",
  },
]

export default function BonusesHelpPage() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800">
      <BettingHeader />
      <main className="container mx-auto px-4 py-36 pb-24 ">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/help" className="p-2 hover:bg-[#1A2F45] rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <h1 className="text-xl font-bold">Bonuses & Promotions</h1>
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
