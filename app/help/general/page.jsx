"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, Info } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "What is GoalBett?",
    a: "GoalBett is a premier online sports betting and casino platform offering live betting, virtual sports, casino games, and more.",
  },
  {
    q: "Is GoalBett licensed?",
    a: "Yes, GoalBett operates under valid gaming licenses and follows all regulatory requirements for online gambling.",
  },
  {
    q: "What countries are supported?",
    a: "We support users from many countries worldwide. Check our Terms & Conditions for the full list of supported regions.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us via Live Chat (24/7), WhatsApp (+46739905688), or email (support@goalbett.com).",
  },
  {
    q: "Is my data secure?",
    a: "Yes, we use industry-standard SSL encryption and security measures to protect your personal and financial data.",
  },
]

export default function GeneralHelpPage() {
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
            <div className="w-10 h-10 rounded-full bg-[#6366F1]/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h1 className="text-xl font-bold">General</h1>
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
