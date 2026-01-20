"use client"
import { useState, useEffect } from "react"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Loader2,
  Users,
  Send,
  ArrowLeftRight,
  Printer,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import AgentWalletTopup from "@/components/agent/agent-wallet-topup"
import { getAuthToken } from "@/lib/auth-service"
import { toast } from "@/components/ui/use-toast"
import { CreditStatusCard } from "@/components/agent/credit-status-card"
import { PrintSlipModal } from "@/components/agent/print-slip-modal"

export default function AgentWallet() {
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [walletBalance, setWalletBalance] = useState(null)
  const [commissionBalance, setCommissionBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subAgents, setSubAgents] = useState([])
  const [transactions, setTransactions] = useState([])

  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState("")
  const [selectedSubAgent, setSelectedSubAgent] = useState("")
  const [transferNote, setTransferNote] = useState("")
  const [transferring, setTransferring] = useState(false)

  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnAmount, setReturnAmount] = useState("")
  const [returnNote, setReturnNote] = useState("")
  const [returning, setReturning] = useState(false)

  const [printSlipOpen, setPrintSlipOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null

    if (!user) {
      window.location.href = "/auth"
      return
    }

    fetchWalletBalance()
    fetchSubAgents()
    fetchTransactions()

    const handleWalletUpdate = () => {
      fetchWalletBalance()
    }

    window.addEventListener("wallet-updated", handleWalletUpdate)

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdate)
    }
  }, [])

  const fetchWalletBalance = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/wallet/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setWalletBalance(data.data)
      }

      const commissionRes = await fetch("/api/agent/commission/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (commissionRes.ok) {
        const commData = await commissionRes.json()
        if (commData.success) {
          setCommissionBalance(commData.balance)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch wallet balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubAgents = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/users/subagents", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSubAgents(data.subAgents || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch sub-agents:", error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/transactions?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch transactions:", error)
      // Fallback demo data
      setTransactions([
        {
          id: "1",
          type: "credit",
          amount: 210,
          description: "Commission - Week 1",
          date: "2025-01-05",
          status: "completed",
          playerId: "player1",
          playerName: "Player One",
        },
        {
          id: "2",
          type: "debit",
          amount: 500,
          description: "Transfer to Sub-Agent",
          date: "2025-01-04",
          status: "completed",
          playerId: "player2",
          playerName: "Player Two",
        },
        {
          id: "3",
          type: "credit",
          amount: 5000,
          description: "Float Top-up from Admin",
          date: "2025-01-03",
          status: "completed",
          playerId: "player3",
          playerName: "Player Three",
        },
      ])
    }
  }

  const handleTransferToSubAgent = async () => {
    if (!selectedSubAgent || !transferAmount || Number.parseFloat(transferAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please select a sub-agent and enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setTransferring(true)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/transfer/subagent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subAgentId: selectedSubAgent,
          amount: Number.parseFloat(transferAmount),
          note: transferNote || "Float transfer",
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: `Transferred $${transferAmount} to sub-agent successfully` })
        setTransferDialogOpen(false)
        setTransferAmount("")
        setSelectedSubAgent("")
        setTransferNote("")
        fetchWalletBalance()
        fetchTransactions()
      } else {
        toast({ title: "Error", description: data.error || "Transfer failed", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Transfer error:", error)
      toast({ title: "Error", description: "Transfer failed. Please try again.", variant: "destructive" })
    } finally {
      setTransferring(false)
    }
  }

  const handleReturnFloat = async () => {
    if (!returnAmount || Number.parseFloat(returnAmount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" })
      return
    }

    setReturning(true)
    try {
      const token = getAuthToken()
      const response = await fetch("/api/agent/transfer/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(returnAmount),
          note: returnNote || "Float return to parent",
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: `Returned $${returnAmount} to parent agent successfully` })
        setReturnDialogOpen(false)
        setReturnAmount("")
        setReturnNote("")
        fetchWalletBalance()
        fetchTransactions()
      } else {
        toast({ title: "Error", description: data.error || "Return failed", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Return error:", error)
      toast({ title: "Error", description: "Return failed. Please try again.", variant: "destructive" })
    } finally {
      setReturning(false)
    }
  }

  const handlePrintReceipt = (transaction) => {
    setSelectedTransaction({
      ...transaction,
      amount: transaction.amount,
      playerId: transaction.playerId,
      playerName: transaction.playerName || transaction.description,
    })
    setPrintSlipOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-[#0A1A2F]">
      <AgentSidebar />

      <main className="flex-1 md:ml-64 p-6 sm:p-4 md:p-6 w-full min-w-0">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="mt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700]">Wallet Management</h1>
            <p className="text-[#F5F5F5] mt-2">Manage your funds, transfer to sub-agents, and top up players</p>
          </div>

          <CreditStatusCard />

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#0A1A2F] text-sm font-medium mb-2">Available Float</p>
                    {loading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#0A1A2F]" />
                    ) : (
                      <p className="text-4xl font-bold text-[#0A1A2F]">
                        {walletBalance?.availableBalance?.toFixed(2) || "0.00"} {walletBalance?.currency || "USD"}
                      </p>
                    )}
                  </div>
                  <Wallet className="w-12 h-12 text-[#0A1A2F]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium mb-2">Commission Wallet</p>
                    {loading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    ) : (
                      <p className="text-4xl font-bold text-white">{commissionBalance?.toFixed(2) || "0.00"} USD</p>
                    )}
                  </div>
                  <DollarSign className="w-12 h-12 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F5F5F5] text-sm mb-2">Locked Balance</p>
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
                    ) : (
                      <p className="text-3xl font-bold text-white">
                        {walletBalance?.lockedBalance?.toFixed(2) || "0.00"} {walletBalance?.currency || "USD"}
                      </p>
                    )}
                  </div>
                  <CreditCard className="w-10 h-10 text-[#FFD700]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F5F5F5] text-sm mb-2">Sub-Agents</p>
                    <p className="text-3xl font-bold text-white">{subAgents.length}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#FFD700]" />
                Float Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transfer to Sub-Agent */}
                <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-16">
                      <Send className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <p className="font-bold">Transfer to Sub-Agent</p>
                        <p className="text-xs opacity-80">Send float to your downline agents</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
                    <DialogHeader>
                      <DialogTitle className="text-[#FFD700]">Transfer Float to Sub-Agent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Sub-Agent</Label>
                        <Select value={selectedSubAgent} onValueChange={setSelectedSubAgent}>
                          <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55] text-white">
                            <SelectValue placeholder="Choose a sub-agent" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                            {subAgents.map((agent) => (
                              <SelectItem key={agent._id} value={agent._id}>
                                {agent.fullName || agent.name} ({agent.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (USD)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                        />
                        <p className="text-xs text-[#8A9DB8]">
                          Available: ${walletBalance?.availableBalance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input
                          placeholder="Transfer note"
                          value={transferNote}
                          onChange={(e) => setTransferNote(e.target.value)}
                          className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setTransferDialogOpen(false)}
                        className="border-[#2A3F55] text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTransferToSubAgent}
                        disabled={transferring}
                        className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
                      >
                        {transferring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Transfer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Return Float to Parent */}
                <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white h-16">
                      <ArrowUpRight className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <p className="font-bold">Return Float to Parent</p>
                        <p className="text-xs opacity-80">Return excess float to upline</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white">
                    <DialogHeader>
                      <DialogTitle className="text-[#FFD700]">Return Float to Parent Agent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Amount (USD)</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={returnAmount}
                          onChange={(e) => setReturnAmount(e.target.value)}
                          className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                        />
                        <p className="text-xs text-[#8A9DB8]">
                          Available: ${walletBalance?.availableBalance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input
                          placeholder="Return reason"
                          value={returnNote}
                          onChange={(e) => setReturnNote(e.target.value)}
                          className="bg-[#0A1A2F] border-[#2A3F55] text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setReturnDialogOpen(false)}
                        className="border-[#2A3F55] text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReturnFloat}
                        disabled={returning}
                        className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]"
                      >
                        {returning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Return Float
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw Tabs */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white">Manage Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="withdraw" className="space-y-4">
                <TabsList className="bg-[#0A1A2F] border border-[#FFD700]/20">
                  <TabsTrigger
                    value="withdraw"
                    className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                  <TabsTrigger
                    value="deposit"
                    className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Request Credits
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="withdraw" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdrawAmount" className="text-white">
                        Withdrawal Amount
                      </Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-white/5 border-[#FFD700]/30 text-white"
                      />
                    </div>

                    <div className="bg-[#FFD700]/10 border border-[#FFD700] rounded-lg p-4">
                      <p className="text-sm text-[#F5F5F5] mb-2">Withdrawal Information:</p>
                      <ul className="text-xs text-[#F5F5F5] space-y-1">
                        <li>• Minimum withdrawal: $50</li>
                        <li>• Processing time: 1-2 business days</li>
                        <li>• Funds will be sent to your registered bank account</li>
                      </ul>
                    </div>

                    <Button
                      className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                      disabled={!withdrawAmount || Number.parseFloat(withdrawAmount) < 50}
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Withdraw ${withdrawAmount || "0"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="deposit" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="depositAmount" className="text-white">
                        Credit Amount
                      </Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-white/5 border-[#FFD700]/30 text-white"
                      />
                    </div>

                    <div className="bg-[#FFD700]/10 border border-[#FFD700] rounded-lg p-4">
                      <p className="text-sm text-[#F5F5F5] mb-2">Credit Request Information:</p>
                      <ul className="text-xs text-[#F5F5F5] space-y-1">
                        <li>• Request will be sent to admin for approval</li>
                        <li>• Credits will be available once approved</li>
                        <li>• You can distribute credits digitally to customers</li>
                      </ul>
                    </div>

                    <Button
                      className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
                      disabled={!depositAmount}
                    >
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      Request ${depositAmount || "0"} Credits
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Agent Wallet Topup Component */}
          <AgentWalletTopup />

          {/* Transaction History */}
          <Card className="bg-white/10 backdrop-blur-sm border-[#FFD700]/20">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn.id || txn._id}
                    className="flex items-center justify-between p-4 bg-[#0A1A2F]/50 rounded-lg border border-[#FFD700]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          txn.type === "credit" ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                      >
                        {txn.type === "credit" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{txn.description}</p>
                        <p className="text-sm text-[#F5F5F5]">{txn.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`font-bold ${txn.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                          {txn.type === "credit" ? "+" : "-"}$
                          {typeof txn.amount === "number" ? txn.amount.toFixed(2) : txn.amount}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {txn.status}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handlePrintReceipt(txn)}
                        className="bg-[#FFD700] hover:bg-[#E5C200] text-[#0A1A2F]"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/30">
            <CardContent className="p-6">
              <h3 className="text-[#FFD700] font-bold text-lg mb-3">How Agent Banking System Works</h3>
              <div className="space-y-2 text-[#B8C5D6] text-sm">
                <p>
                  <strong className="text-[#FFD700]">Available Float:</strong> Money you can use to top up players or
                  transfer to sub-agents
                </p>
                <p>
                  <strong className="text-[#FFD700]">Commission Wallet:</strong> Earnings from GGR that are settled
                  weekly (every Monday)
                </p>
                <p>
                  <strong className="text-[#FFD700]">Transfer to Sub-Agent:</strong> Send float instantly to your
                  downline agents
                </p>
                <p>
                  <strong className="text-[#FFD700]">Return Float:</strong> Return excess float to your parent agent if
                  needed
                </p>
                <div className="mt-4 p-3 bg-[#0A1A2F]/50 rounded border border-[#FFD700]/20">
                  <p className="text-xs text-[#FFD700]">
                    Commission Settlement: Every Monday at 00:00 UTC, your commission is calculated from Net GGR and
                    transferred to your Commission Wallet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PrintSlipModal
        open={printSlipOpen}
        onOpenChange={setPrintSlipOpen}
        transaction={selectedTransaction}
        type={selectedTransaction?.type === "deposit" ? "deposit" : "withdrawal"}
      />
    </div>
  )
}
