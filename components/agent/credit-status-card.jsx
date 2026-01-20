"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Shield, AlertTriangle, TrendingUp } from "lucide-react"

export function CreditStatusCard() {
  const [creditData, setCreditData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditStatus()
  }, [])

  const fetchCreditStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/credit", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCreditData(data.credit)
      }
    } catch (error) {
      console.error("Failed to fetch credit status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-[#0D1F35] border-[#2A3F55]">
        <CardContent className="p-6 text-center text-[#B8C5D6]">Loading credit status...</CardContent>
      </Card>
    )
  }

  if (!creditData) {
    return (
      <Card className="bg-[#0D1F35] border-[#2A3F55]">
        <CardContent className="p-6 text-center text-[#B8C5D6]">Unable to load credit status</CardContent>
      </Card>
    )
  }

  const utilizationPercent = Number.parseFloat(creditData.utilizationPercent) || 0
  const isHighUtilization = utilizationPercent > 80
  const isCritical = utilizationPercent > 95

  return (
    <Card className="bg-[#0D1F35] border-[#2A3F55]">
      <CardHeader>
        <CardTitle className="text-[#FFD700] flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Credit Status
        </CardTitle>
        <CardDescription className="text-[#B8C5D6]">
          Your credit limit is tied 1:1 to your collateral deposit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collateral & Credit Limit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[#1A2F45] rounded-lg">
            <div className="flex items-center gap-2 text-[#B8C5D6] text-sm mb-1">
              <Shield className="w-4 h-4" />
              Collateral Deposit
            </div>
            <p className="text-2xl font-bold text-white">${creditData.collateralDeposit.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-[#1A2F45] rounded-lg">
            <div className="flex items-center gap-2 text-[#B8C5D6] text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Credit Limit
            </div>
            <p className="text-2xl font-bold text-[#FFD700]">${creditData.creditLimit.toLocaleString()}</p>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#B8C5D6]">Credit Utilization</span>
            <span className={isCritical ? "text-red-400" : isHighUtilization ? "text-yellow-400" : "text-green-400"}>
              {utilizationPercent}%
            </span>
          </div>
          <Progress
            value={utilizationPercent}
            className="h-3"
            // Custom colors based on utilization
          />
          <div className="flex items-center justify-between text-xs text-[#B8C5D6]">
            <span>Used: ${creditData.usedCredit.toLocaleString()}</span>
            <span>Available: ${creditData.availableCredit.toLocaleString()}</span>
          </div>
        </div>

        {/* Warning if high utilization */}
        {isHighUtilization && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${isCritical ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
          >
            <AlertTriangle className="w-5 h-5" />
            <div className="text-sm">
              {isCritical
                ? "Critical: Credit nearly exhausted. Deposit more collateral to continue issuing credit."
                : "Warning: Credit utilization is high. Consider depositing more collateral."}
            </div>
          </div>
        )}

        {/* Ratio Info */}
        <div className="pt-4 border-t border-[#2A3F55]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#B8C5D6]">Collateral Ratio</span>
            <Badge className="bg-[#2A3F55] text-white">{creditData.collateralRatio}:1</Badge>
          </div>
          <p className="text-xs text-[#6B7F95] mt-1">Your credit limit = Collateral × {creditData.collateralRatio}</p>
        </div>
      </CardContent>
    </Card>
  )
}
