"use client"

import { useState } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Copy,
  Play,
  CheckCircle,
  AlertCircle,
  Book,
  Zap,
  Shield,
  Search,
  Wallet,
  Gamepad2,
  TrendingUp,
  Users,
  CreditCard,
  Loader2,
} from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { getVersionInfo } from "@/lib/version"

export default function APIDocsPage() {
  const [testResults, setTestResults] = useState({}) // Store results by endpoint path
  const [testing, setTesting] = useState(false)
  const [testingEndpoint, setTestingEndpoint] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalResult, setModalResult] = useState(null)
  const versionInfo = getVersionInfo()

  const apiEndpoints = {
    sports: [
      {
        method: "GET",
        path: "/api/sandbox/sports/events",
        title: "Get Sports Events",
        description: "Retrieve all available sports events with odds",
        auth: true,
        params: [
          { name: "status", type: "string", required: false, description: "Filter by status (upcoming/live/all)" },
        ],
        response: {
          success: true,
          data: [
            {
              _id: "event_id",
              name: "Team A vs Team B",
              sport: "football",
              odds: { home: 1.85, away: 2.1, draw: 3.2 },
              status: "upcoming",
            },
          ],
          count: 1,
        },
      },
      {
        method: "POST",
        path: "/api/sandbox/sports/events",
        title: "Create Sports Event",
        description: "Create a new sports event with odds",
        auth: true,
        body: {
          name: "Team A vs Team B",
          sport: "football",
          league: "Premier League",
          startTime: "2024-12-20T15:00:00Z",
          odds: { home: 1.85, away: 2.1, draw: 3.2 },
        },
        response: {
          success: true,
          data: { _id: "event_id", name: "Team A vs Team B" },
        },
      },
      {
        method: "POST",
        path: "/api/sandbox/sports/bets",
        title: "Place Bet",
        description: "Place a sports bet with max-win enforcement",
        auth: true,
        body: {
          selections: [
            {
              eventId: "event_id",
              selection: "home",
              odds: 1.85,
              eventName: "Team A vs Team B",
            },
          ],
          stake: 100,
          betType: "single",
        },
        response: {
          success: true,
          data: {
            ticketNumber: "BET-123456",
            stake: 100,
            potentialWin: 185,
            status: "pending",
          },
        },
      },
      {
        method: "POST",
        path: "/api/sandbox/sports/settle",
        title: "Settle Bet",
        description: "Manually settle a bet (won/lost/void)",
        auth: true,
        body: {
          betId: "bet_id",
          status: "won",
          results: { event_id: "home" },
        },
        response: {
          success: true,
          data: { betId: "bet_id", status: "won", payout: 185 },
        },
      },
    ],
    casino: [
      {
        method: "POST",
        path: "/api/sandbox/casino/play",
        title: "Play Casino Game",
        description: "Play a casino game (Dice, Crash, Mines) with provably fair verification",
        auth: true,
        body: {
          game: "dice",
          stake: 50,
          gameParams: { target: 50, type: "over" },
          action: "quick_play",
        },
        response: {
          success: true,
          data: {
            roundNumber: "CASINO-DICE-ABC123",
            result: { won: true, roll: 75 },
            payout: 99,
            verification: {
              serverSeed: "hashed_seed",
              clientSeed: "user_seed",
              nonce: 1,
            },
          },
        },
      },
      {
        method: "GET",
        path: "/api/sandbox/casino/verify",
        title: "Verify Provably Fair",
        description: "Verify casino round results using server seed, client seed, and nonce",
        auth: true,
        params: [{ name: "round", type: "string", required: true, description: "Round number to verify" }],
        response: {
          success: true,
          data: {
            valid: true,
            serverSeed: "revealed_seed",
            clientSeed: "user_seed",
            nonce: 1,
            result: 75,
            algorithm: "HMAC-SHA256",
          },
        },
      },
      {
        method: "GET",
        path: "/api/sandbox/casino/stats",
        title: "Get Casino Stats",
        description: "Get casino statistics and RTP information",
        auth: true,
        response: {
          success: true,
          data: {
            totalRounds: 150,
            totalStaked: 5000,
            totalPayout: 4800,
            rtp: 96.0,
          },
        },
      },
    ],
    wallet: [
      {
        method: "GET",
        path: "/api/wallet/balance",
        title: "Get Wallet Balance",
        description: "Retrieve current wallet balance for authenticated user",
        auth: true,
        response: {
          success: true,
          data: {
            balance: 1000.5,
            currency: "USD",
            pendingWithdrawals: 0,
            availableBalance: 1000.5,
          },
        },
      },
      {
        method: "POST",
        path: "/api/wallet/deposit",
        title: "Create Deposit",
        description: "Initiate a deposit transaction",
        auth: true,
        body: {
          amount: 100,
          paymentMethod: "card",
          currency: "USD",
        },
        response: {
          success: true,
          data: {
            transactionId: "TXN-123456",
            amount: 100,
            status: "pending",
            paymentUrl: "https://payment.gateway/...",
          },
        },
      },
      {
        method: "POST",
        path: "/api/wallet/withdraw",
        title: "Request Withdrawal",
        description: "Request a withdrawal from wallet",
        auth: true,
        body: {
          amount: 50,
          withdrawalMethod: "bank_transfer",
          accountDetails: {
            bankName: "Example Bank",
            accountNumber: "****1234",
          },
        },
        response: {
          success: true,
          data: {
            withdrawalId: "WD-123456",
            amount: 50,
            status: "pending_approval",
            estimatedTime: "24-48 hours",
          },
        },
      },
      {
        method: "GET",
        path: "/api/wallet/transactions",
        title: "Get Transaction History",
        description: "Retrieve wallet transaction history with pagination",
        auth: true,
        params: [
          { name: "type", type: "string", required: false, description: "Filter by type (deposit/withdrawal/bet/win)" },
          { name: "limit", type: "number", required: false, description: "Results per page (default: 20)" },
          { name: "page", type: "number", required: false, description: "Page number (default: 1)" },
        ],
        response: {
          success: true,
          data: [
            {
              id: "TXN-123",
              type: "deposit",
              amount: 100,
              status: "completed",
              createdAt: "2025-12-26T10:00:00Z",
            },
          ],
          pagination: { page: 1, limit: 20, total: 50 },
        },
      },
    ],
    agent: [
      {
        method: "POST",
        path: "/api/agent/transfer/subagent",
        title: "Transfer to Sub-Agent",
        description: "Transfer float balance to a sub-agent",
        auth: true,
        body: {
          subAgentId: "agent_id",
          amount: 500,
          note: "Weekly float allocation",
        },
        response: {
          success: true,
          data: {
            transferId: "TRF-123456",
            amount: 500,
            fromAgent: "parent_agent_id",
            toAgent: "sub_agent_id",
            newBalance: 4500,
          },
        },
      },
      {
        method: "POST",
        path: "/api/agent/topup/player",
        title: "Top Up Player",
        description: "Agent tops up a player's wallet from their float",
        auth: true,
        body: {
          playerId: "player_id",
          amount: 100,
          reference: "CASH-001",
        },
        response: {
          success: true,
          data: {
            transactionId: "TOP-123456",
            playerNewBalance: 100,
            agentNewBalance: 4400,
          },
        },
      },
      {
        method: "POST",
        path: "/api/agent/withdraw/player",
        title: "Player Cash Out",
        description: "Process a player cash-out through agent",
        auth: true,
        body: {
          playerId: "player_id",
          amount: 50,
        },
        response: {
          success: true,
          data: {
            transactionId: "WD-123456",
            playerNewBalance: 50,
            agentNewBalance: 4450,
          },
        },
      },
      {
        method: "GET",
        path: "/api/agent/commission/balance",
        title: "Get Commission Balance",
        description: "Get agent's commission wallet balance",
        auth: true,
        response: {
          success: true,
          data: {
            commissionBalance: 250.5,
            pendingCommission: 45.0,
            totalEarned: 1250.0,
            lastSettlement: "2025-12-23T00:00:00Z",
          },
        },
      },
    ],
    reports: [
      {
        method: "GET",
        path: "/api/sandbox/reports/ggr",
        title: "Get GGR Report",
        description: "Get Gross Gaming Revenue breakdown",
        auth: true,
        params: [
          { name: "startDate", type: "string", required: false, description: "Start date (ISO format)" },
          { name: "endDate", type: "string", required: false, description: "End date (ISO format)" },
        ],
        response: {
          success: true,
          data: {
            totalStaked: 10000,
            totalPayout: 9200,
            ggr: 800,
            commissionRate: 0.15,
            commission: 120,
          },
        },
      },
      {
        method: "GET",
        path: "/api/super/bi-engine",
        title: "Get NGR/Net Profit",
        description: "Get Net Gaming Revenue with all deductions (provider fees, gateway fees, bonuses)",
        auth: true,
        params: [
          { name: "tenantId", type: "string", required: false, description: "Filter by tenant" },
          { name: "period", type: "string", required: false, description: "Period (day/week/month)" },
        ],
        response: {
          success: true,
          data: {
            grossRevenue: 10000,
            providerFees: 1200,
            gatewayFees: 250,
            bonusCosts: 500,
            taxes: 800,
            netProfit: 7250,
            margin: 72.5,
          },
        },
      },
    ],
  }

  const testEndpoint = async (endpoint) => {
    setTesting(true)
    setTestingEndpoint(endpoint.path)

    const startTime = performance.now()

    try {
      const options = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      let url = endpoint.path
      if (endpoint.method === "GET" && endpoint.params) {
        const queryParams = new URLSearchParams()
        endpoint.params.forEach((param) => {
          if (!param.required) {
            if (param.name === "status") queryParams.set(param.name, "all")
            if (param.name === "limit") queryParams.set(param.name, "10")
            if (param.name === "page") queryParams.set(param.name, "1")
          }
        })
        const queryString = queryParams.toString()
        if (queryString) {
          url = `${url}?${queryString}`
        }
      }

      const response = await fetch(url, options)
      const endTime = performance.now()
      const responseTime = endTime - startTime

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        time: responseTime.toFixed(0),
        endpoint: endpoint,
      }

      // Store result for this endpoint
      setTestResults((prev) => ({
        ...prev,
        [endpoint.path]: result,
      }))

      // Show in modal
      setModalResult(result)
      setModalOpen(true)
    } catch (error) {
      const endTime = performance.now()
      const result = {
        success: false,
        status: 0,
        error: error.message,
        time: (endTime - startTime).toFixed(0),
        endpoint: endpoint,
      }

      setTestResults((prev) => ({
        ...prev,
        [endpoint.path]: result,
      }))

      setModalResult(result)
      setModalOpen(true)
    } finally {
      setTesting(false)
      setTestingEndpoint(null)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const filterEndpoints = (endpoints) => {
    if (!searchQuery) return endpoints
    const query = searchQuery.toLowerCase()
    return endpoints.filter(
      (ep) =>
        ep.title.toLowerCase().includes(query) ||
        ep.path.toLowerCase().includes(query) ||
        ep.description.toLowerCase().includes(query),
    )
  }

  const categoryIcons = {
    sports: TrendingUp,
    casino: Gamepad2,
    wallet: Wallet,
    agent: Users,
    reports: CreditCard,
  }

  const categoryLabels = {
    sports: "Sports Betting",
    casino: "Casino Games",
    wallet: "Wallet & Payments",
    agent: "Agent Banking",
    reports: "Reports & BI",
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#FFD700] flex items-center gap-3">
              <Book className="w-8 h-8" />
              API Documentation
            </h1>
            <p className="text-[#8A9DB8] mt-2">Complete API reference for Game Hub, Wallet, and Agent Systems</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3 py-1">
              {versionInfo.version}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              All Systems Operational
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A9DB8] w-5 h-5" />
          <Input
            placeholder="Search endpoints by name, path, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
          />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const Icon = categoryIcons[key]
            const count = apiEndpoints[key]?.length || 0
            return (
              <Card key={key} className="bg-[#0D1F35] border-[#2A3F55]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                    <Icon className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="text-[#F5F5F5] font-medium">{label}</p>
                    <p className="text-[#8A9DB8] text-sm">{count} endpoints</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Authentication */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-[#1A2F45] rounded-lg p-4">
              <p className="text-[#F5F5F5] mb-2">All API endpoints require JWT authentication:</p>
              <div className="bg-[#0A1A2F] rounded p-3 font-mono text-sm text-[#8A9DB8] flex items-center justify-between">
                <span>Authorization: Bearer &lt;your_jwt_token&gt;</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard("Authorization: Bearer <your_jwt_token>")}
                  className="text-[#8A9DB8] hover:text-[#FFD700]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-1">Base URL</h4>
                <p className="text-[#8A9DB8] text-sm font-mono">/api</p>
              </div>
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-1">Content Type</h4>
                <p className="text-[#8A9DB8] text-sm font-mono">application/json</p>
              </div>
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-1">Response Format</h4>
                <p className="text-[#8A9DB8] text-sm font-mono">JSON</p>
              </div>
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-1">Rate Limit</h4>
                <p className="text-[#8A9DB8] text-sm font-mono">100 req/min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Tabs defaultValue="sports" className="space-y-6">
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55] p-1 flex-wrap h-auto">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key]
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(apiEndpoints).map(([category, endpoints]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {filterEndpoints(endpoints).length === 0 ? (
                <Card className="bg-[#0D1F35] border-[#2A3F55]">
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 text-[#8A9DB8] mx-auto mb-4" />
                    <p className="text-[#8A9DB8]">No endpoints match your search</p>
                  </CardContent>
                </Card>
              ) : (
                filterEndpoints(endpoints).map((endpoint, idx) => {
                  const endpointResult = testResults[endpoint.path]
                  return (
                    <Card key={idx} className="bg-[#0D1F35] border-[#2A3F55]">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Badge
                                className={
                                  endpoint.method === "GET"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                    : endpoint.method === "POST"
                                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                                      : endpoint.method === "PUT"
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                }
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-[#8A9DB8] text-sm font-mono">{endpoint.path}</code>
                              {endpoint.auth && (
                                <Badge
                                  variant="outline"
                                  className="bg-orange-500/10 text-orange-400 border-orange-500/30"
                                >
                                  <Shield className="w-3 h-3 mr-1" />
                                  Auth
                                </Badge>
                              )}
                              {endpointResult && (
                                <Badge
                                  variant="outline"
                                  className={
                                    endpointResult.success
                                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                                      : "bg-red-500/10 text-red-400 border-red-500/30"
                                  }
                                >
                                  {endpointResult.success ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {endpointResult.status} - {endpointResult.time}ms
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-[#F5F5F5] text-lg">{endpoint.title}</CardTitle>
                            <CardDescription className="text-[#8A9DB8]">{endpoint.description}</CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0A1A2F] bg-transparent"
                            onClick={() => testEndpoint(endpoint)}
                            disabled={testing}
                          >
                            {testing && testingEndpoint === endpoint.path ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Test
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Parameters */}
                        {endpoint.params && (
                          <div>
                            <h4 className="text-[#FFD700] font-medium mb-2">Query Parameters</h4>
                            <div className="bg-[#1A2F45] rounded-lg overflow-hidden">
                              {endpoint.params.map((param, pidx) => (
                                <div
                                  key={pidx}
                                  className="flex items-center gap-4 p-3 border-b border-[#2A3F55] last:border-0"
                                >
                                  <code className="text-blue-400 font-medium min-w-[100px]">{param.name}</code>
                                  <span className="text-[#8A9DB8] text-sm">{param.type}</span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      param.required
                                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                                        : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                                    }
                                  >
                                    {param.required ? "required" : "optional"}
                                  </Badge>
                                  <span className="text-[#8A9DB8] text-sm flex-1">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request Body */}
                        {endpoint.body && (
                          <div>
                            <h4 className="text-[#FFD700] font-medium mb-2">Request Body</h4>
                            <SyntaxHighlighter
                              language="json"
                              style={vscDarkPlus}
                              customStyle={{
                                background: "#1A2F45",
                                padding: "1rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              {JSON.stringify(endpoint.body, null, 2)}
                            </SyntaxHighlighter>
                          </div>
                        )}

                        {/* Example Response */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[#FFD700] font-medium">Response</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2))}
                              className="text-[#8A9DB8] hover:text-[#FFD700]"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                            customStyle={{
                              background: "#1A2F45",
                              padding: "1rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            {JSON.stringify(endpoint.response, null, 2)}
                          </SyntaxHighlighter>
                        </div>

                        {endpointResult && (
                          <div
                            className={`rounded-lg p-4 ${
                              endpointResult.success
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-red-500/10 border border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {endpointResult.success ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                                <span className={endpointResult.success ? "text-green-400" : "text-red-400"}>
                                  Last Test: {endpointResult.status}{" "}
                                  {endpointResult.statusText || (endpointResult.success ? "OK" : "Error")}
                                </span>
                                <span className="text-[#8A9DB8] text-sm">{endpointResult.time}ms</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setModalResult(endpointResult)
                                  setModalOpen(true)
                                }}
                                className="text-[#8A9DB8] hover:text-[#FFD700]"
                              >
                                View Full Response
                              </Button>
                            </div>
                            <SyntaxHighlighter
                              language="json"
                              style={vscDarkPlus}
                              customStyle={{
                                background: "#0A1A2F",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                maxHeight: "150px",
                                overflow: "auto",
                              }}
                            >
                              {JSON.stringify(endpointResult.data || endpointResult.error, null, 2).slice(0, 500) +
                                (JSON.stringify(endpointResult.data || endpointResult.error, null, 2).length > 500
                                  ? "\n... (click 'View Full Response' for more)"
                                  : "")}
                            </SyntaxHighlighter>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Error Handling */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Error Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#8A9DB8]">All API responses follow this standard error format:</p>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                background: "#1A2F45",
                padding: "1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {JSON.stringify(
                {
                  success: false,
                  error: "Error message description",
                  code: "ERROR_CODE",
                  details: "Additional context (optional)",
                },
                null,
                2,
              )}
            </SyntaxHighlighter>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-2">Common Status Codes</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-400">200</span>
                    <span className="text-[#8A9DB8]">Success</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">201</span>
                    <span className="text-[#8A9DB8]">Created</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">400</span>
                    <span className="text-[#8A9DB8]">Bad Request</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-400">401</span>
                    <span className="text-[#8A9DB8]">Unauthorized</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-400">403</span>
                    <span className="text-[#8A9DB8]">Forbidden</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">500</span>
                    <span className="text-[#8A9DB8]">Server Error</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-2">Error Codes</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <code className="text-blue-400">INVALID_TOKEN</code>
                    <span className="text-[#8A9DB8]">JWT expired/invalid</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-400">INSUFFICIENT_BALANCE</code>
                    <span className="text-[#8A9DB8]">Not enough funds</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-400">MAX_WIN_EXCEEDED</code>
                    <span className="text-[#8A9DB8]">Bet exceeds limit</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-400">RATE_LIMITED</code>
                    <span className="text-[#8A9DB8]">Too many requests</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {modalResult?.success ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <span className={modalResult?.success ? "text-green-400" : "text-red-400"}>
                Test Result: {modalResult?.status} {modalResult?.statusText || ""}
              </span>
              <span className="text-[#8A9DB8] text-sm font-normal ml-auto">{modalResult?.time}ms</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1">
            {modalResult?.endpoint && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={
                    modalResult.endpoint.method === "GET"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-green-500/10 text-green-400 border-green-500/30"
                  }
                >
                  {modalResult.endpoint.method}
                </Badge>
                <code className="text-[#8A9DB8] text-sm font-mono">{modalResult.endpoint.path}</code>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#FFD700] font-medium">Response Body</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(JSON.stringify(modalResult?.data || modalResult?.error, null, 2))}
                  className="text-[#8A9DB8] hover:text-[#FFD700]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  background: "#1A2F45",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  maxHeight: "400px",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(modalResult?.data || { error: modalResult?.error }, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
