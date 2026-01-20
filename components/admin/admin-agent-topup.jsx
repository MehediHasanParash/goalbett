"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Users, DollarSign, Loader2, CheckCircle, XCircle } from "lucide-react"

export function AdminAgentTopup({ onSuccess }) {
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedAgentData, setSelectedAgentData] = useState(null)
  const [amount, setAmount] = useState("")
  const [fundingType, setFundingType] = useState("BANK_TRANSFER")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [tenantCurrency, setTenantCurrency] = useState("USD")

  useEffect(() => {
    fetchAgents()
    fetchTenantInfo()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/tenant/current", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success && data.tenant?.settings?.currency) {
        setTenantCurrency(data.tenant.settings.currency)
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err)
    }
  }

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/users/agents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setAgents(data.data || [])
      } else {
        setError(data.error || "Failed to load agents")
      }
    } catch (err) {
      console.error("Fetch agents error:", err)
      setError("Failed to load agents")
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId)
    const agent = agents.find((a) => a._id === agentId)
    setSelectedAgentData(agent)
  }

  const getAgentCurrency = () => {
    if (selectedAgentData?.settings?.currency) {
      return selectedAgentData.settings.currency
    }
    if (selectedAgentData?.currency) {
      return selectedAgentData.currency
    }
    return tenantCurrency
  }

  const handleTopup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = localStorage.getItem("auth_token")
      const currency = getAgentCurrency()

      const response = await fetch(`/api/admin/agents/${selectedAgent}/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          currency: currency,
          fundingType,
          cashReceiptPhotoUrl: fundingType === "CASH" ? "https://placeholder.com/receipt.jpg" : undefined,
          witnessPhoneNumbers: fundingType === "CASH" ? ["+251912345678"] : undefined,
        }),
      })

      const data = await response.json()
      console.log("[v0] Topup API response:", data)

      if (data.success) {
        setResult({ ...data.data, currency })
        setAmount("")
        setSelectedAgent("")
        setSelectedAgentData(null)
        if (onSuccess) {
          await onSuccess({ ...data.data, currency })
        }
        setTimeout(() => setResult(null), 5000)
      } else {
        setError(data.error || "Failed to top up agent")
      }
    } catch (err) {
      console.error("[v0] Topup error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const displayCurrency = getAgentCurrency()

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[#FFD700]" />
          Top Up Agent Float
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTopup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent" className="text-[#F5F5F5]">
              Select Agent
            </Label>
            {loadingAgents ? (
              <div className="flex items-center gap-2 p-3 bg-[#0A1A2F] border border-[#FFD700]/30 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                <span className="text-sm text-[#B8C5D6]">Loading agents...</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">No agents found. Please create an agent first.</span>
              </div>
            ) : (
              <Select value={selectedAgent} onValueChange={handleAgentChange} required>
                <SelectTrigger className="bg-[#0A1A2F] border-[#FFD700]/30 text-white">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30">
                  {agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id} className="text-white hover:bg-[#1A2F45]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#FFD700]" />
                        <span>
                          {agent.fullName} ({agent.phone || agent.email})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#F5F5F5]">
              Amount ({displayCurrency})
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-[#FFD700]/50" />
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 bg-[#0A1A2F] border-[#FFD700]/30 text-white"
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundingType" className="text-[#F5F5F5]">
              Funding Type
            </Label>
            <Select value={fundingType} onValueChange={setFundingType}>
              <SelectTrigger className="bg-[#0A1A2F] border-[#FFD700]/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1A2F] border-[#FFD700]/30">
                <SelectItem value="CASH" className="text-white hover:bg-[#1A2F45]">
                  Cash Deposit
                </SelectItem>
                <SelectItem value="BANK_TRANSFER" className="text-white hover:bg-[#1A2F45]">
                  Bank Transfer
                </SelectItem>
                <SelectItem value="MOBILE_MONEY" className="text-white hover:bg-[#1A2F45]">
                  Mobile Money
                </SelectItem>
                <SelectItem value="CREDIT_LINE" className="text-white hover:bg-[#1A2F45]">
                  Credit Line
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-sm text-green-300">
                <p className="font-semibold">Success! Agent topped up</p>
                <p className="text-xs mt-1">
                  New Balance: {result.newAgentBalance} {result.currency}
                  {result.requiresApproval && " (Pending Approval)"}
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !selectedAgent || agents.length === 0}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Top Up Agent
              </>
            )}
          </Button>
        </form>

        {fundingType === "CASH" && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-300">
              <strong>Note:</strong> Cash deposits require receipt photo and witness phone numbers. For production, use
              the file upload component to capture these details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
