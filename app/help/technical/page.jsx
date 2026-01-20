"use client"
import { BettingHeader } from "@/components/shared/betting-header"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronUp, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const faqs = [
  {
    q: "The website is not loading properly",
    a: "Try clearing your browser cache and cookies, then refresh the page. If the issue persists, try using a different browser or device.",
  },
  {
    q: "I can't place a bet",
    a: "Ensure you have sufficient balance in your account. Check if the event is still open for betting. Some markets may be suspended temporarily.",
  },
  {
    q: "The app is crashing",
    a: "Make sure you have the latest version installed. Try restarting your device. If issues continue, uninstall and reinstall the app.",
  },
  {
    q: "Live streaming is not working",
    a: "Check your internet connection. Live streaming requires a stable connection. Try reducing video quality or switching to a different network.",
  },
  {
    q: "My bet slip is not updating",
    a: "Refresh the page to get the latest odds. Odds change frequently based on market conditions. Some selections may become unavailable.",
  },
]

export default function TechnicalHelpPage() {
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
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h1 className="text-xl font-bold">Technical</h1>
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
