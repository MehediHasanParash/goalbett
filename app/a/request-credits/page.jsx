"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import AgentSidebar from "@/components/agent/agent-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getAuthToken } from "@/lib/auth-service"
import {
  CreditCard,
  Building2,
  Smartphone,
  Bitcoin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  AtSign,
  Search,
  Loader2,
} from "lucide-react"

export default function RequestCreditsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [requests, setRequests] = useState([])

  // Request type: "self" or "player"
  const [requestType, setRequestType] = useState("self")

  // Player search states
  const [searchType, setSearchType] = useState("phone")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Form states
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")

  const paymentMethods = [
    { id: "bank_transfer", name: "Bank Transfer", icon: Building2, description: "Direct bank deposit" },
    { id: "mpesa", name: "M-Pesa Pay", icon: Smartphone, description: "Mobile money" },
    { id: "orange_pay", name: "Orange Pay", icon: Smartphone, description: "Mobile money" },
    { id: "crypto", name: "Cryptocurrency", icon: Bitcoin, description: "BTC, ETH, USDT" },
  ]

  const quickAmounts = [1000, 2500, 5000, 10000]

  // Fetch recent requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const res = await fetch("/api/agent/credit-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setRequests(data.data || [])
      }
    } catch (err) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Search for players
  const searchPlayers = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const token = getAuthToken()
      const res = await fetch(
        `/api/agent/players?search=${encodeURIComponent(searchQuery)}&searchType=${searchType}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.data || [])
      }
    } catch (err) {
      console.error("Error searching players:", err)
    } finally {
      setSearching(false)
    }
  }, [searchQuery, searchType])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (requestType === "player" && searchQuery.length >= 2) {
        searchPlayers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchType, requestType, searchPlayers])

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 100) {
      setError("Minimum request amount is $100")
      return
    }

    if (requestType === "player" && !selectedPlayer) {
      setError("Please select a player")
      return
    }

    if (!reference) {
      setError("Please enter a transaction reference")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const token = getAuthToken()
      const res = await fetch("/api/agent/credit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod,
          transactionReference: reference,
          notes,
          requestType,
          playerId: requestType === "player" ? selectedPlayer?._id : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccess("Credit request submitted successfully!")
        setAmount("")
        setReference("")
        setNotes("")
        setSelectedPlayer(null)
        setSearchQuery("")
        fetchRequests()
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || "Failed to submit request")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    const icons = {
      pending: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
    }
    const Icon = icons[status] || Clock
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getPlayerDisplayName = (player) => {
    if (player.firstName || player.lastName) {
      return `${player.firstName || ""} ${player.lastName || ""}`.trim()
    }
    return player.username || player.email || player.phone || "Unknown"
  }

  const getPlayerIdentifier = (player) => {
    return player.phone || player.email || player.username || ""
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AgentSidebar />
      <main className="flex-1 p-4 md:p-6 md:ml-64">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-500">Request New Credits</h1>
            <p className="text-gray-400 mt-1">Submit a credit request with payment proof</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Request Form */}
          <Card className="bg-[#12121a] border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5 text-yellow-500" />
                Request New Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Type Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">Request Credits For</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={requestType === "self" ? "default" : "outline"}
                    className={
                      requestType === "self"
                        ? "bg-[#1a1a25] border-yellow-500/50 text-white"
                        : "bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800"
                    }
                    onClick={() => {
                      setRequestType("self")
                      setSelectedPlayer(null)
                      setSearchQuery("")
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Myself (Agent)
                  </Button>
                  <Button
                    type="button"
                    variant={requestType === "player" ? "default" : "outline"}
                    className={
                      requestType === "player"
                        ? "bg-yellow-600 text-white"
                        : "bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800"
                    }
                    onClick={() => setRequestType("player")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    For a Player
                  </Button>
                </div>
              </div>

              {/* Player Search (only if requestType === "player") */}
              {requestType === "player" && (
                <div className="space-y-3">
                  <Label className="text-gray-300">Search Player By</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "phone", label: "Phone", icon: Phone },
                      { id: "username", label: "Username", icon: AtSign },
                      { id: "email", label: "Email", icon: Mail },
                    ].map((type) => (
                      <Button
                        key={type.id}
                        type="button"
                        size="sm"
                        variant={searchType === type.id ? "default" : "outline"}
                        className={
                          searchType === type.id
                            ? "bg-yellow-600 text-white"
                            : "bg-transparent border-gray-700 text-gray-400"
                        }
                        onClick={() => {
                          setSearchType(type.id)
                          setSearchQuery("")
                          setSearchResults([])
                        }}
                      >
                        <type.icon className="h-4 w-4 mr-1" />
                        {type.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Find Player</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder={`Search by ${searchType}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#1a1a25] border-gray-700 text-white"
                        disabled={!!selectedPlayer}
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && !selectedPlayer && (
                      <div className="bg-[#1a1a25] border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((player) => (
                          <button
                            key={player._id}
                            className="w-full p-3 text-left hover:bg-gray-800 flex items-center gap-3 border-b border-gray-800 last:border-0"
                            onClick={() => {
                              setSelectedPlayer(player)
                              setSearchResults([])
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{getPlayerDisplayName(player)}</p>
                              <p className="text-gray-500 text-sm">{getPlayerIdentifier(player)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {searchQuery.length >= 2 && searchResults.length === 0 && !searching && !selectedPlayer && (
                      <p className="text-gray-500 text-sm">No players found matching "{searchQuery}"</p>
                    )}

                    {/* Selected Player */}
                    {selectedPlayer && (
                      <div className="p-3 bg-[#1a1a25] border border-yellow-500/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{getPlayerDisplayName(selectedPlayer)}</p>
                            <p className="text-gray-500 text-sm">{getPlayerIdentifier(selectedPlayer)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => {
                            setSelectedPlayer(null)
                            setSearchQuery("")
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-gray-300">Credit Amount (USD)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#1a1a25] border-gray-700 text-white"
                />
                <p className="text-gray-500 text-sm">Minimum request: $100</p>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    className={`border-gray-700 ${
                      Number(amount) === value
                        ? "bg-yellow-600 text-white border-yellow-500"
                        : "bg-transparent text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setAmount(value.toString())}
                  >
                    ${value.toLocaleString()}
                  </Button>
                ))}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-gray-300">Select Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        paymentMethod === method.id
                          ? "bg-[#1a1a25] border-yellow-500/50"
                          : "bg-transparent border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            paymentMethod === method.id ? "border-yellow-500 bg-yellow-500" : "border-gray-600"
                          }`}
                        />
                        <method.icon
                          className={`h-5 w-5 ${paymentMethod === method.id ? "text-yellow-500" : "text-gray-500"}`}
                        />
                        <div>
                          <p className={paymentMethod === method.id ? "text-yellow-500 font-medium" : "text-white"}>
                            {method.name}
                          </p>
                          <p className="text-gray-500 text-sm">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="p-4 bg-[#1a1a25] rounded-lg">
                <h4 className="font-semibold text-white mb-2">Payment Instructions</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Bank Name:</span> KCB Bank
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Account Number:</span> 1234567890
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Account Name:</span> Goal Betting Ltd
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Branch:</span> Nairobi Main
                  </p>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="space-y-2">
                <Label className="text-gray-300">Transaction Reference / Receipt Number</Label>
                <Input
                  placeholder="Enter your payment reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="bg-[#1a1a25] border-gray-700 text-white"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-gray-300">Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#1a1a25] border-gray-700 text-white min-h-[80px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !amount || Number(amount) < 100 || !reference}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Submit Credit Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card className="bg-[#12121a] border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5 text-yellow-500" />
                Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No credit requests yet. Submit your first request above.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req._id} className="p-4 bg-[#1a1a25] rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">${req.amount.toLocaleString()}</p>
                        <p className="text-gray-500 text-sm">
                          {req.paymentMethod} • {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        {req.requestType === "player" && req.playerId && (
                          <p className="text-yellow-500 text-sm">For: {req.playerId.username || req.playerId.phone}</p>
                        )}
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
