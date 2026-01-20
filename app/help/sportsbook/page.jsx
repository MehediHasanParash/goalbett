"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, Trophy } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "How do I place a bet?",
    a: "Browse sports events, click on the odds you want to bet on, enter your stake in the betslip, and confirm your bet.",
  },
  {
    q: "What are live/in-play bets?",
    a: "Live bets are placed on events that are currently in progress. Odds update in real-time based on the match situation.",
  },
  {
    q: "What is a parlay/accumulator?",
    a: "A parlay combines multiple selections into one bet. All selections must win for the bet to pay out, but potential winnings are higher.",
  },
  {
    q: "Why was my bet voided?",
    a: "Bets may be voided if an event is cancelled, postponed, or if there's a significant error in odds. Voided bets are refunded.",
  },
  {
    q: "What are the minimum/maximum stakes?",
    a: "Minimum bet is $0.50. Maximum stake varies by event and market. High-value bets may require approval.",
  },
]

export default function SportsbookHelpPage() {
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
            <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#10B981]" />
            </div>
            <h1 className="text-xl font-bold">Sportsbook</h1>
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
