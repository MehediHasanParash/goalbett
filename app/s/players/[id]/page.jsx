"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, DollarSign, Ban, CheckCircle, Eye, ExternalLink, FileText, ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function PlayerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id

  const [playerData, setPlayerData] = useState(null)
  const [player, setPlayer] = useState({})
  const [kycDocuments, setKycDocuments] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdrawFunds, setShowWithdrawFunds] = useState(false)
  const [showSuspendAccount, setShowSuspendAccount] = useState(false)
  const [showKYCVerification, setShowKYCVerification] = useState(false)
  const [showDocumentPreview, setShowDocumentPreview] = useState(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [suspensionReason, setSuspensionReason] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("30")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPlayerData()
  }, [params.id])

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")

      const response = await fetch(`/api/super/players/pms?playerId=${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] PMS data:", data)
        console.log("[v0] KYC data:", data.kyc)
        console.log("[v0] KYC documents:", data.kyc?.documents)
        setPlayerData(data)
        setPlayer(data.player)
        setKycDocuments(data.kyc?.documents || {})
      }
    } catch (error) {
      console.error("[v0] Error fetching player data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/players/pms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          action: "add_funds",
          data: {
            amount: Number.parseFloat(amount),
            description: description || "Funds added by admin",
          },
        }),
      })

      if (response.ok) {
        setShowAddFunds(false)
        setAmount("")
        setDescription("")
        fetchPlayerData()
      }
    } catch (error) {
      console.error("[v0] Error adding funds:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdrawFunds = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/players/pms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          action: "withdraw_funds",
          data: {
            amount: Number.parseFloat(amount),
            description: description || "Funds withdrawn by admin",
          },
        }),
      })

      if (response.ok) {
        setShowWithdrawFunds(false)
        setAmount("")
        setDescription("")
        fetchPlayerData()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to withdraw funds")
      }
    } catch (error) {
      console.error("[v0] Error withdrawing funds:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendAccount = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/players/pms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          action: "suspend_account",
          data: {
            reason: suspensionReason,
            days: Number.parseInt(suspensionDays),
          },
        }),
      })

      if (response.ok) {
        setShowSuspendAccount(false)
        setSuspensionReason("")
        setSuspensionDays("30")
        fetchPlayerData()
      }
    } catch (error) {
      console.error("[v0] Error suspending account:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivateAccount = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/super/players/pms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          action: "activate_account",
          data: {},
        }),
      })

      if (response.ok) {
        fetchPlayerData()
      }
    } catch (error) {
      console.error("[v0] Error activating account:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyKYC = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("auth_token")
      await fetch("/api/super/players/pms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          action: "update_kyc_status",
          data: {
            identityStatus: "verified",
            addressStatus: "verified",
            selfieStatus: "verified",
            overallStatus: "verified",
            verificationLevel: "full",
          },
        }),
      })
      setShowKYCVerification(false)
      fetchPlayerData()
    } catch (error) {
      console.error("[v0] Error verifying KYC:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const balance = player.balance || 0
  const wallet = playerData?.wallet || {}
  const bets = playerData?.bets || []
  const transactions = playerData?.transactions || []

  const tenantInfo = {
    name: player.tenant_id?.name || player.tenant_id?.metadata?.businessName || "N/A",
    domain: player.tenant_id?.subdomain || player.tenant_id?.primaryDomain || "N/A",
  }

  const getDocUrl = (docType) => {
    if (docType === "identity") {
      return kycDocuments.identity?.frontImage || kycDocuments.identity?.url
    } else if (docType === "proofOfAddress") {
      return kycDocuments.proofOfAddress?.image || kycDocuments.proofOfAddress?.url
    } else if (docType === "selfie") {
      return kycDocuments.selfie?.image || kycDocuments.selfie?.url
    }
    return null
  }

  const identityUrl = getDocUrl("identity")
  const addressUrl = getDocUrl("proofOfAddress")
  const selfieUrl = getDocUrl("selfie")

  // Check if any KYC document has a URL
  const hasKYCDocuments = identityUrl || addressUrl || selfieUrl

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#FFD700]">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#FFD700]">{player.username || player.fullName || "Player"}</h1>
            <p className="text-[#B8C5D6]">Player ID: {playerId}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 mb-1">{tenantInfo.name}</Badge>
          <p className="text-xs text-[#B8C5D6]">{tenantInfo.domain}</p>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Player Info & Financial */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Information */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4">Player Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#B8C5D6]">Email</p>
                  <p className="font-medium text-[#F5F5F5]">{player.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Phone</p>
                  <p className="font-medium text-[#F5F5F5]">{player.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Username</p>
                  <p className="font-medium text-[#F5F5F5]">{player.username || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6]">Registration Date</p>
                  <p className="font-medium text-[#F5F5F5]">{new Date(player.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            {/* Financial Details */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Details
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0A1A2F] p-4 rounded-lg border border-green-500/30">
                  <p className="text-sm text-[#B8C5D6]">Current Balance</p>
                  <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A1A2F] p-4 rounded-lg">
                  <p className="text-sm text-[#B8C5D6]">Total Wagered</p>
                  <p className="text-2xl font-bold text-[#F5F5F5]">${(wallet?.totalWagered || 0).toFixed(2)}</p>
                </div>
                <div className="bg-[#0A1A2F] p-4 rounded-lg">
                  <p className="text-sm text-[#B8C5D6]">Total Won</p>
                  <p className="text-2xl font-bold text-[#F5F5F5]">${(wallet?.totalWinnings || 0).toFixed(2)}</p>
                </div>
                <div className="bg-[#0A1A2F] p-4 rounded-lg border border-red-500/30">
                  <p className="text-sm text-[#B8C5D6]">Total Lost</p>
                  <p className="text-2xl font-bold text-red-400">
                    ${((wallet?.totalWagered || 0) - (wallet?.totalWinnings || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddFunds(true)}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                >
                  + Add Funds
                </Button>
                <Button
                  onClick={() => setShowWithdrawFunds(true)}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                >
                  $ Withdraw Funds
                </Button>
              </div>
            </Card>

            {/* Recent Bets */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4">Recent Bets</h2>
              {bets && bets.length > 0 ? (
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <div key={bet._id} className="bg-[#0A1A2F] p-4 rounded-lg border border-[#2A3F55]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono text-xs text-[#B8C5D6]">{bet.betId || bet._id}</p>
                          <p className="text-sm text-[#B8C5D6]">
                            {bet.betType} - {bet.selections?.length || 0} selection(s)
                          </p>
                        </div>
                        <Badge
                          className={
                            bet.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : bet.status === "won"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {bet.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-[#B8C5D6]">Stake:</p>
                          <p className="font-bold text-[#F5F5F5]">${bet.stake?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[#B8C5D6]">Odds:</p>
                          <p className="font-bold text-[#F5F5F5]">{bet.totalOdds?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[#B8C5D6]">Potential:</p>
                          <p className="font-bold text-green-400">${bet.potentialWin?.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#B8C5D6] mt-2">{new Date(bet.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#B8C5D6] py-8">No recent bets found.</p>
              )}
            </Card>

            {/* Transaction History */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4">Transaction History</h2>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex justify-between items-center py-3 border-b border-[#2A3F55] last:border-0"
                    >
                      <div className="flex-1">
                        <p className={`font-bold ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-[#B8C5D6]">{tx.description || tx.type}</p>
                        <p className="text-xs text-[#B8C5D6]">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge
                        className={
                          tx.status === "completed"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#B8C5D6] py-8">No transaction history found.</p>
              )}
            </Card>
          </div>

          {/* Right Column - Account Status & KYC */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4">Account Status</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#B8C5D6] mb-2">KYC Status</p>
                  <Badge
                    className={
                      player.kyc_status === "verified"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : player.kyc_status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {player.kyc_status || "unknown"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-[#B8C5D6] mb-2">Account Status</p>
                  <Badge
                    className={
                      player.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : player.status === "suspended"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {player.status}
                  </Badge>
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => setShowKYCVerification(true)}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify KYC
                  </Button>
                  {player.status === "active" ? (
                    <Button
                      onClick={() => setShowSuspendAccount(true)}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      onClick={handleActivateAccount}
                      disabled={actionLoading}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate Account
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* KYC Documents */}
            <Card className="bg-[#1A2F45]/50 border-[#2A3F55] p-6">
              <h2 className="text-xl font-bold text-[#FFD700] mb-4">KYC Documents</h2>
              <div className="space-y-4">
                {/* Identity Document */}
                <div className="p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#B8C5D6]" />
                      <span className="font-medium text-[#F5F5F5]">Identity</span>
                    </div>
                    <Badge
                      className={
                        kycDocuments.identity?.status === "verified" || kycDocuments.identity?.status === "approved"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : kycDocuments.identity?.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {kycDocuments.identity?.status || "not uploaded"}
                    </Badge>
                  </div>
                  {identityUrl && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => setShowDocumentPreview({ type: "Identity", url: identityUrl })}
                        size="sm"
                        className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#FFD700]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <a href={identityUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#1A2F45] hover:bg-[#2A3F55] text-blue-400">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </a>
                    </div>
                  )}
                </div>

                {/* Proof of Address */}
                <div className="p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#B8C5D6]" />
                      <span className="font-medium text-[#F5F5F5]">Proof of Address</span>
                    </div>
                    <Badge
                      className={
                        kycDocuments.proofOfAddress?.status === "verified" ||
                        kycDocuments.proofOfAddress?.status === "approved"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : kycDocuments.proofOfAddress?.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {kycDocuments.proofOfAddress?.status || "not uploaded"}
                    </Badge>
                  </div>
                  {addressUrl && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => setShowDocumentPreview({ type: "Proof of Address", url: addressUrl })}
                        size="sm"
                        className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#FFD700]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <a href={addressUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#1A2F45] hover:bg-[#2A3F55] text-blue-400">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </a>
                    </div>
                  )}
                </div>

                {/* Selfie */}
                <div className="p-4 bg-[#0A1A2F] rounded-lg border border-[#2A3F55]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#B8C5D6]" />
                      <span className="font-medium text-[#F5F5F5]">Selfie with ID</span>
                    </div>
                    <Badge
                      className={
                        kycDocuments.selfie?.status === "verified" || kycDocuments.selfie?.status === "approved"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : kycDocuments.selfie?.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {kycDocuments.selfie?.status || "not uploaded"}
                    </Badge>
                  </div>
                  {selfieUrl && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => setShowDocumentPreview({ type: "Selfie", url: selfieUrl })}
                        size="sm"
                        className="bg-[#1A2F45] hover:bg-[#2A3F55] text-[#FFD700]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <a href={selfieUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#1A2F45] hover:bg-[#2A3F55] text-blue-400">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">Add Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Amount</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddFunds}
                  disabled={actionLoading || !amount}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  {actionLoading ? "Adding..." : "Add Funds"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Funds Modal */}
      {showWithdrawFunds && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Amount</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={balance}
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                />
                <p className="text-xs text-[#B8C5D6] mt-1">Available: ${balance.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowWithdrawFunds(false)}
                  className="flex-1 bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdrawFunds}
                  disabled={actionLoading || !amount}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {actionLoading ? "Withdrawing..." : "Withdraw"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Suspend Account Modal */}
      {showSuspendAccount && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4">Suspend Account</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Suspension Duration (days)</label>
                <Input
                  type="number"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  placeholder="30"
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label className="text-sm text-[#B8C5D6] mb-2 block">Reason</label>
                <Textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  className="bg-[#0A1A2F] border-[#2A3F55] text-[#F5F5F5]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowSuspendAccount(false)}
                  className="flex-1 bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSuspendAccount}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {actionLoading ? "Suspending..." : "Suspend"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* KYC Verification Modal */}
      {showKYCVerification && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="bg-[#0D1F35] border-[#2A3F55] p-6 max-w-3xl w-full my-8">
            <h3 className="text-xl font-bold text-[#FFD700] mb-2">KYC Verification</h3>
            <p className="text-[#B8C5D6] mb-6">
              Review and verify the player's KYC documents. Click on images to view full size.
            </p>

            <div className="space-y-6">
              {/* Identity Document */}
              <div className="bg-[#0A1A2F] p-4 rounded-lg border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#F5F5F5]">Identity Document</h4>
                  <Badge
                    className={
                      kycDocuments.identity?.status === "verified" || kycDocuments.identity?.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : kycDocuments.identity?.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }
                  >
                    {kycDocuments.identity?.status || "not uploaded"}
                  </Badge>
                </div>
                {identityUrl ? (
                  <div className="space-y-2">
                    <a href={identityUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={identityUrl || "/placeholder.svg"}
                        alt="Identity Document"
                        className="max-h-48 rounded-lg border border-[#2A3F55] hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                    {kycDocuments.identity.uploadedAt && (
                      <p className="text-xs text-[#B8C5D6]">
                        Uploaded: {new Date(kycDocuments.identity.uploadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#B8C5D6] text-sm">No document uploaded</p>
                )}
              </div>

              {/* Proof of Address */}
              <div className="bg-[#0A1A2F] p-4 rounded-lg border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#F5F5F5]">Proof of Address</h4>
                  <Badge
                    className={
                      kycDocuments.proofOfAddress?.status === "verified" ||
                      kycDocuments.proofOfAddress?.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : kycDocuments.proofOfAddress?.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }
                  >
                    {kycDocuments.proofOfAddress?.status || "not uploaded"}
                  </Badge>
                </div>
                {addressUrl ? (
                  <div className="space-y-2">
                    <a href={addressUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={addressUrl || "/placeholder.svg"}
                        alt="Proof of Address"
                        className="max-h-48 rounded-lg border border-[#2A3F55] hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                    {kycDocuments.proofOfAddress.uploadedAt && (
                      <p className="text-xs text-[#B8C5D6]">
                        Uploaded: {new Date(kycDocuments.proofOfAddress.uploadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#B8C5D6] text-sm">No document uploaded</p>
                )}
              </div>

              {/* Selfie */}
              <div className="bg-[#0A1A2F] p-4 rounded-lg border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#F5F5F5]">Selfie with ID</h4>
                  <Badge
                    className={
                      kycDocuments.selfie?.status === "verified" || kycDocuments.selfie?.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : kycDocuments.selfie?.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }
                  >
                    {kycDocuments.selfie?.status || "not uploaded"}
                  </Badge>
                </div>
                {selfieUrl ? (
                  <div className="space-y-2">
                    <a href={selfieUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={selfieUrl || "/placeholder.svg"}
                        alt="Selfie"
                        className="max-h-48 rounded-lg border border-[#2A3F55] hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                    {kycDocuments.selfie.uploadedAt && (
                      <p className="text-xs text-[#B8C5D6]">
                        Uploaded: {new Date(kycDocuments.selfie.uploadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#B8C5D6] text-sm">No document uploaded</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-6">
              <Button
                onClick={() => setShowKYCVerification(false)}
                className="flex-1 bg-[#1A2F45] hover:bg-[#2A3F55] text-[#F5F5F5]"
              >
                Close
              </Button>
              <Button
                onClick={handleVerifyKYC}
                disabled={actionLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {actionLoading ? "Approving..." : "Approve All Documents"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocumentPreview && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowDocumentPreview(null)}
        >
          <div className="max-w-4xl max-h-[90vh] w-full">
            <div className="bg-[#0D1F35] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#FFD700]">{showDocumentPreview.type}</h3>
                <Button
                  onClick={() => setShowDocumentPreview(null)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  Close
                </Button>
              </div>
            </div>
            <img
              src={showDocumentPreview.url || "/placeholder.svg"}
              alt={showDocumentPreview.type}
              className="max-w-full max-h-[80vh] mx-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
