"use client"
import { useState, useEffect } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { Zap, GitBranch } from "lucide-react"

export function MatchRouting() {
  const [routingMode, setRoutingMode] = useState("hybrid")
  const [routingStats, setRoutingStats] = useState({
    single: 0,
    multiple: 0,
    hybrid: 0,
  })

  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem("routingStats") || '{"single":0,"multiple":0,"hybrid":0}')
    setRoutingStats(stats)
  }, [])

  const determineRoute = (selections) => {
    if (selections.length === 1) {
      return "single" // Single match routing
    } else if (selections.length > 1 && selections.every((s) => s.gameId === selections[0].gameId)) {
      return "single-game" // Same game multi-selection
    } else {
      return "multi-match" // Multiple matches routing
    }
  }

  const routingExamples = [
    {
      type: "Single Match",
      selections: ["Man Utd vs Chelsea - Win"],
      route: "Direct to match odds page",
      description: "Single selection goes directly to detailed match view",
    },
    {
      type: "Multiple Same-Game",
      selections: ["Man Utd vs Chelsea - Win", "Man Utd vs Chelsea - Over 2.5"],
      route: "Combined single-game interface",
      description: "Multiple selections from same game combined into one bet",
    },
    {
      type: "Multiple Matches",
      selections: ["Man Utd vs Chelsea - Win", "Liverpool vs Arsenal - Win"],
      route: "Multi-leg parlay interface",
      description: "Multiple different matches route to parlay builder",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-[#FFD700]" />
          Match Routing - Hybrid Approach
        </h2>
        <p className="text-muted-foreground">Intelligent routing system for optimized betting experience</p>
      </div>

      {/* Routing Mode Selector */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Routing Mode</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="hybrid"
                checked={routingMode === "hybrid"}
                onChange={() => setRoutingMode("hybrid")}
                className="w-4 h-4"
              />
              <label htmlFor="hybrid" className="flex-1 cursor-pointer">
                <div className="font-semibold text-sm">Hybrid Mode (Recommended)</div>
                <p className="text-xs text-muted-foreground">Automatically routes based on selection type</p>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="single"
                checked={routingMode === "single"}
                onChange={() => setRoutingMode("single")}
                className="w-4 h-4"
              />
              <label htmlFor="single" className="flex-1 cursor-pointer">
                <div className="font-semibold text-sm">Single-Match Only</div>
                <p className="text-xs text-muted-foreground">Always route to single match interface</p>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="multi"
                checked={routingMode === "multi"}
                onChange={() => setRoutingMode("multi")}
                className="w-4 h-4"
              />
              <label htmlFor="multi" className="flex-1 cursor-pointer">
                <div className="font-semibold text-sm">Multi-Match Only</div>
                <p className="text-xs text-muted-foreground">Always route to parlay/multi interface</p>
              </label>
            </div>
          </div>
        </div>
      </Card3D>

      {/* How It Works */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">How Hybrid Routing Works</h3>
          <div className="space-y-4">
            {routingExamples.map((example, index) => (
              <div key={index} className="p-4 bg-[#1A2F45] rounded-lg border border-[#2A3F55]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{example.type}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                  </div>
                  <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded-full whitespace-nowrap">
                    {example.route}
                  </span>
                </div>
                <div className="text-xs text-[#B8C5D6]">
                  <p className="font-mono">{example.selections.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card3D>

      {/* Routing Statistics */}
      <Card3D>
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Your Routing Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#1A2F45] rounded-lg">
              <div className="text-2xl font-bold text-[#FFD700]">{routingStats.single}</div>
              <p className="text-xs text-muted-foreground mt-2">Single Routes</p>
            </div>
            <div className="text-center p-4 bg-[#1A2F45] rounded-lg">
              <div className="text-2xl font-bold text-[#FFD700]">{routingStats.multiple}</div>
              <p className="text-xs text-muted-foreground mt-2">Multiple Routes</p>
            </div>
            <div className="text-center p-4 bg-[#1A2F45] rounded-lg">
              <div className="text-2xl font-bold text-[#FFD700]">{routingStats.hybrid}</div>
              <p className="text-xs text-muted-foreground mt-2">Hybrid Switches</p>
            </div>
          </div>
        </div>
      </Card3D>

      {/* Benefits */}
      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFD700]" />
            Benefits of Hybrid Routing
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Faster betting flow - fewer clicks</li>
            <li>• Optimized interface for each bet type</li>
            <li>• Intelligent detection of selection patterns</li>
            <li>• Better mobile experience</li>
            <li>• Reduced page loads</li>
            <li>• Improved user satisfaction</li>
          </ul>
        </div>
      </Card3D>
    </div>
  )
}
