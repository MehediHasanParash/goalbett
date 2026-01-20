"use client"
import { useState, useEffect } from "react"
import { AlertCircle, AlertTriangle } from "lucide-react"

export function RiskManagement({ bets }) {
  const [riskAlerts, setRiskAlerts] = useState([])
  const [slipHistory, setSlipHistory] = useState([])

  useEffect(() => {
    // Load slip history
    const history = JSON.parse(localStorage.getItem("slipHistory") || "[]")
    setSlipHistory(history)

    // Check for duplicate slip patterns
    const alerts = []
    const currentSlipPattern = bets.map((b) => `${b.match}-${b.selection}`).join("|")

    if (currentSlipPattern) {
      const duplicateCount = history.filter((entry) => entry.pattern === currentSlipPattern).length

      if (duplicateCount >= 3) {
        alerts.push({
          type: "critical",
          icon: AlertTriangle,
          title: "RISK ALERT: Repeated Slip Pattern",
          message: `This exact slip combination has been played ${duplicateCount} times. Consider diversifying your bets.`,
          color: "red",
        })
      } else if (duplicateCount >= 1) {
        alerts.push({
          type: "warning",
          icon: AlertCircle,
          title: "Pattern Alert",
          message: `This slip has been played ${duplicateCount} time(s) before.`,
          color: "orange",
        })
      }
    }

    setRiskAlerts(alerts)
  }, [bets])

  if (riskAlerts.length === 0) return null

  return (
    <div className="space-y-3">
      {riskAlerts.map((alert, index) => {
        const Icon = alert.icon
        const colorClass = alert.color === "red" ? "red-500" : "orange-500"
        const bgColorClass = alert.color === "red" ? "red-500/10" : "orange-500/10"
        const borderColorClass = alert.color === "red" ? "red-500/30" : "orange-500/30"
        const textColorClass = alert.color === "red" ? "red-400" : "orange-400"

        return (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 bg-${bgColorClass} border border-${borderColorClass} rounded-lg`}
          >
            <Icon className={`w-5 h-5 text-${textColorClass} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h4 className={`font-semibold text-${textColorClass} text-sm mb-1`}>{alert.title}</h4>
              <p className={`text-xs text-${textColorClass}/80`}>{alert.message}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
