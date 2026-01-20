"use client"

import { useState } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Database, Server, CheckCircle, Download, ExternalLink, Lock, Activity } from "lucide-react"

export default function RegulatorDocsPage() {
  const [activeSection, setActiveSection] = useState("overview")

  return (
    <SuperAdminLayout
      title="Regulator Documentation"
      description="Complete technical documentation for regulatory compliance review"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#0D1F35] border border-[#FFD700]/30 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FFD700] flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Platform Compliance Documentation
            </h1>
            <p className="text-[#B8C5D6] mt-2">
              This documentation demonstrates that our platform meets all regulatory requirements for online sports
              betting and casino operations.
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="bg-[#0D1F35] border border-[#2A3F55] flex-wrap h-auto p-2">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="architecture"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
          >
            Architecture
          </TabsTrigger>
          <TabsTrigger value="sports" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Sports Betting
          </TabsTrigger>
          <TabsTrigger value="casino" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Casino
          </TabsTrigger>
          <TabsTrigger value="wallet" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Wallet & Ledger
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Security
          </TabsTrigger>
          <TabsTrigger value="testing" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            Testing Guide
          </TabsTrigger>
        </TabsList>

        {/* Overview Section */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-[#B8C5D6]">
                This platform is a fully functional, production-ready online gambling system that includes:
              </p>
              <ul className="text-[#B8C5D6] space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-[#F5F5F5]">Sports Betting Engine</strong> - Multi-selection bet slips with
                    server-side max-winning enforcement
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-[#F5F5F5]">Casino Games</strong> - Dice, Crash, and Mines with provably fair
                    verification
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-[#F5F5F5]">Double-Entry Ledger</strong> - Immutable transaction records with
                    full audit trail
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-[#F5F5F5]">Settlement Engine</strong> - Automatic and manual bet settlement
                    with GGR calculation
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-[#F5F5F5]">Compliance Tools</strong> - KYC, responsible gambling limits, and
                    regulatory reporting
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-6">
                <Database className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Data Integrity</h3>
                <p className="text-[#8A9DB8] text-sm">
                  All transactions are recorded in an immutable double-entry ledger system. No direct balance edits are
                  possible.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-6">
                <Lock className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Security</h3>
                <p className="text-[#8A9DB8] text-sm">
                  JWT authentication, role-based access control, encrypted data storage, and complete audit logging.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0D1F35] border-[#2A3F55]">
              <CardContent className="p-6">
                <Activity className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Transparency</h3>
                <p className="text-[#8A9DB8] text-sm">
                  Provably fair casino games, real-time reporting, and complete transaction history available for audit.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Architecture Section */}
        <TabsContent value="architecture" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">System Architecture</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                High-level overview of system components and data flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1A2F45] rounded-lg p-6 font-mono text-sm">
                <pre className="text-[#B8C5D6] whitespace-pre-wrap">
                  {`┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Player App    │  Agent Portal    │  Admin Dashboard            │
│  (Next.js)     │  (Next.js)       │  (Next.js)                  │
└────────┬───────┴────────┬─────────┴────────┬────────────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  REST API (Next.js API Routes)                                  │
│  - Authentication & Authorization (JWT)                          │
│  - Rate Limiting                                                 │
│  - Request Validation                                            │
└────────┬───────┬────────┬─────────┬────────┬────────────────────┘
         │       │        │         │        │
         ▼       ▼        ▼         ▼        ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   Sports   │ │   Casino   │ │   Wallet   │ │  Reports   │
│   Engine   │ │   Engine   │ │   Service  │ │   Engine   │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LEDGER ENGINE                               │
│  Double-Entry Accounting System                                  │
│  - Debit/Credit entries for every transaction                    │
│  - Balance snapshots for audit                                   │
│  - Immutable transaction history                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Atlas                                                   │
│  - Users, Wallets, Bets, Casino Rounds                          │
│  - Ledger Entries, Audit Logs                                   │
│  - Encrypted at rest                                            │
└─────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Key Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    SandboxSportsEngine
                  </h4>
                  <p className="text-[#8A9DB8] text-sm">
                    Handles event creation, bet placement, odds calculation, and max-winning enforcement. Located at:{" "}
                    <code className="text-[#FFD700]">lib/sandbox/sports-engine.js</code>
                  </p>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    SandboxCasinoEngine
                  </h4>
                  <p className="text-[#8A9DB8] text-sm">
                    Provably fair game engine for Dice, Crash, and Mines with RTP tracking. Located at:{" "}
                    <code className="text-[#FFD700]">lib/sandbox/casino-engine.js</code>
                  </p>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-400" />
                    SettlementEngine
                  </h4>
                  <p className="text-[#8A9DB8] text-sm">
                    Automatic and manual bet settlement, GGR calculation, and commission distribution. Located at:{" "}
                    <code className="text-[#FFD700]">lib/sandbox/settlement-engine.js</code>
                  </p>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#FFD700]" />
                    LedgerEngine
                  </h4>
                  <p className="text-[#8A9DB8] text-sm">
                    Double-entry accounting for all financial transactions with audit trail. Located at:{" "}
                    <code className="text-[#FFD700]">lib/ledger-engine.js</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sports Betting Section */}
        <TabsContent value="sports" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Sports Betting System</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Complete sports betting functionality with regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Max Winning Enforcement (Critical)</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-[#B8C5D6] mb-3">
                    The system enforces a maximum winning limit of <strong className="text-[#FFD700]">500,000</strong>{" "}
                    per bet slip. This is enforced server-side, not just in the UI.
                  </p>
                  <div className="bg-[#0D1F35] rounded-lg p-4 font-mono text-sm">
                    <pre className="text-[#B8C5D6]">
                      {`// From lib/sandbox/sports-engine.js

static async validateBetLimits({ stake, selections, tenantId, userId }) {
  const limits = await this.getLimits(tenantId)
  const totalOdds = this.calculateTotalOdds(selections)
  const potentialWin = stake * totalOdds

  // MAX WINNING ENFORCEMENT (Critical for regulators)
  if (potentialWin > limits.maxWinning) {
    result.valid = false
    result.enforcement.maxWinningEnforced = true
    result.enforcement.maxAllowedStake = limits.maxWinning / totalOdds
    result.errors.push("Potential winning exceeds maximum limit")
  }

  return result
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Multi-Selection Bet Slips</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <ul className="text-[#B8C5D6] space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span>Supports 1-100 selections per slip (accumulator bets)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span>Odds multiply together for total odds calculation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span>Duplicate event selections prevented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span>Each selection validated against event status</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Settlement Process</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <ol className="text-[#B8C5D6] space-y-2 list-decimal list-inside">
                    <li>Admin sets event result (score)</li>
                    <li>System evaluates each selection against result</li>
                    <li>Bet status updated (won/lost/void)</li>
                    <li>Winning payouts credited via ledger</li>
                    <li>GGR calculated and recorded</li>
                    <li>Audit log entry created</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Casino Section */}
        <TabsContent value="casino" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Casino Games System</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Provably fair casino games with complete audit trail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Provably Fair System</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-[#B8C5D6] mb-3">
                    All games use cryptographic provably fair verification using HMAC-SHA256:
                  </p>
                  <div className="bg-[#0D1F35] rounded-lg p-4 font-mono text-sm">
                    <pre className="text-[#B8C5D6]">
                      {`// Provably Fair Algorithm

1. Server generates random seed (64 hex characters)
2. Server seed hash shown to player BEFORE game
3. Player provides client seed
4. Game round nonce increments

Random = HMAC-SHA256(serverSeed, clientSeed:nonce)
Result = Convert first 8 hex chars to number / 0xFFFFFFFF

Players can verify any round by:
1. Checking serverSeedHash matches SHA256(serverSeed)
2. Recalculating the random number
3. Applying game-specific logic`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Dice Game</h4>
                  <p className="text-[#8A9DB8] text-sm mb-2">Roll over/under a target number (1-99)</p>
                  <ul className="text-[#8A9DB8] text-xs space-y-1">
                    <li>• House edge: 1%</li>
                    <li>• Multiplier: (0.99 / win_chance)</li>
                    <li>• Min multiplier: 1.01x</li>
                    <li>• Max multiplier: 99x</li>
                  </ul>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Crash Game</h4>
                  <p className="text-[#8A9DB8] text-sm mb-2">Cash out before the multiplier crashes</p>
                  <ul className="text-[#8A9DB8] text-xs space-y-1">
                    <li>• House edge: 1%</li>
                    <li>• Crash point: 99 / (1 - random)</li>
                    <li>• Auto-cashout supported</li>
                    <li>• Minimum crash: 1.00x</li>
                  </ul>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Mines Game</h4>
                  <p className="text-[#8A9DB8] text-sm mb-2">Reveal tiles without hitting mines</p>
                  <ul className="text-[#8A9DB8] text-xs space-y-1">
                    <li>• 5x5 grid (25 tiles)</li>
                    <li>• 1-24 mines configurable</li>
                    <li>• Multiplier increases per tile</li>
                    <li>• House edge: 1% spread</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">RTP Tracking</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <p className="text-[#B8C5D6]">
                    Return to Player (RTP) is calculated and tracked for every game type:
                  </p>
                  <ul className="text-[#8A9DB8] text-sm mt-2 space-y-1">
                    <li>• Theoretical RTP: ~99% (1% house edge)</li>
                    <li>• Actual RTP tracked per round and aggregated</li>
                    <li>• Statistics available in GGR reports</li>
                    <li>• Per-game breakdown available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet & Ledger Section */}
        <TabsContent value="wallet" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Double-Entry Ledger System</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Immutable financial records with complete audit trail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Core Principles</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <ul className="text-[#B8C5D6] space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-[#F5F5F5]">No Direct Balance Edits</strong>
                        <p className="text-sm">Balances can only change through ledger transactions</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-[#F5F5F5]">Every Transaction Has Debit & Credit</strong>
                        <p className="text-sm">Money always moves from one account to another</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-[#F5F5F5]">Balance Snapshots</strong>
                        <p className="text-sm">Before/after balances recorded for each entry</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-[#F5F5F5]">Unique Entry Numbers</strong>
                        <p className="text-sm">Every entry has a unique, sequential ID for audit</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Transaction Types</h4>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <Badge variant="outline" className="justify-center">
                      DEPOSIT
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      WITHDRAWAL
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      BET_PLACEMENT
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      BET_WINNING
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      BET_LOSS
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      BET_REFUND
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      BONUS_CREDIT
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      AGENT_COMMISSION
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      MANUAL_CREDIT
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      MANUAL_DEBIT
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#F5F5F5] font-medium mb-3">Example: Bet Placement Flow</h4>
                <div className="bg-[#0D1F35] rounded-lg p-4 font-mono text-sm">
                  <pre className="text-[#B8C5D6]">
                    {`Player places $100 bet:

Ledger Entry Created:
├── Entry Number: LE-20241216-000001
├── Transaction Type: BET_PLACEMENT
├── Debit Account: Player Wallet (User #123)
│   ├── Balance Before: $1,000
│   └── Balance After: $900
├── Credit Account: Bet Stakes (Revenue)
│   ├── Balance Before: $50,000
│   └── Balance After: $50,100
├── Amount: $100
├── Reference: Bet #ABC123
└── Timestamp: 2024-12-16 14:30:00`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Section */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Security Measures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Authentication</h4>
                  <ul className="text-[#8A9DB8] text-sm space-y-1">
                    <li>• JWT-based authentication</li>
                    <li>• Secure password hashing (bcrypt)</li>
                    <li>• Session management</li>
                    <li>• Multi-factor authentication (optional)</li>
                  </ul>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Authorization</h4>
                  <ul className="text-[#8A9DB8] text-sm space-y-1">
                    <li>• Role-based access control (RBAC)</li>
                    <li>• Tenant isolation</li>
                    <li>• API rate limiting</li>
                    <li>• Permission matrices</li>
                  </ul>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Data Protection</h4>
                  <ul className="text-[#8A9DB8] text-sm space-y-1">
                    <li>• Encryption at rest (MongoDB Atlas)</li>
                    <li>• TLS for all connections</li>
                    <li>• PII data handling</li>
                    <li>• GDPR compliance tools</li>
                  </ul>
                </div>
                <div className="bg-[#1A2F45] rounded-lg p-4">
                  <h4 className="text-[#F5F5F5] font-medium mb-2">Audit & Monitoring</h4>
                  <ul className="text-[#8A9DB8] text-sm space-y-1">
                    <li>• Complete audit logging</li>
                    <li>• IP tracking</li>
                    <li>• Suspicious activity alerts</li>
                    <li>• Real-time monitoring</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Guide Section */}
        <TabsContent value="testing" className="space-y-6">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Regulator Testing Guide</CardTitle>
              <CardDescription className="text-[#8A9DB8]">
                Step-by-step instructions for testing all system functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#F5F5F5] font-medium mb-3">Test 1: Sports Betting Flow</h4>
                <ol className="text-[#B8C5D6] space-y-2 list-decimal list-inside">
                  <li>
                    Navigate to{" "}
                    <a href="/s/sandbox-testing" className="text-[#FFD700] underline">
                      Sandbox Testing Console
                    </a>
                  </li>
                  <li>Create a demo event with custom odds</li>
                  <li>Add selections to bet slip (try multiple)</li>
                  <li>Enter stake amount</li>
                  <li>Verify potential win calculation</li>
                  <li>Try to exceed max winning limit (500,000)</li>
                  <li>Confirm system blocks the bet</li>
                  <li>Reduce stake to valid amount</li>
                  <li>Place the bet successfully</li>
                  <li>Verify wallet balance decreased</li>
                  <li>Navigate to Settlement tab</li>
                  <li>Settle the event with a result</li>
                  <li>Verify bet status updated</li>
                  <li>Check winning credited (if applicable)</li>
                </ol>
              </div>

              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#F5F5F5] font-medium mb-3">Test 2: Casino Games</h4>
                <ol className="text-[#B8C5D6] space-y-2 list-decimal list-inside">
                  <li>Navigate to Casino Games tab</li>
                  <li>Select Dice game</li>
                  <li>Set target and roll type</li>
                  <li>Enter stake and play</li>
                  <li>View result and multiplier</li>
                  <li>Click "Verify Provably Fair"</li>
                  <li>Confirm server seed hash matches</li>
                  <li>Test Crash game with auto-cashout</li>
                  <li>Test Mines game</li>
                  <li>Review RTP statistics</li>
                </ol>
              </div>

              <div className="bg-[#1A2F45] rounded-lg p-4">
                <h4 className="text-[#F5F5F5] font-medium mb-3">Test 3: Audit & Reports</h4>
                <ol className="text-[#B8C5D6] space-y-2 list-decimal list-inside">
                  <li>
                    Navigate to{" "}
                    <a href="/s/wallet-ledger" className="text-[#FFD700] underline">
                      Wallet & Ledger
                    </a>
                  </li>
                  <li>Review ledger entries from tests</li>
                  <li>Verify debit/credit entries match</li>
                  <li>Check balance snapshots</li>
                  <li>
                    Navigate to{" "}
                    <a href="/s/audit-logs" className="text-[#FFD700] underline">
                      Audit Logs
                    </a>
                  </li>
                  <li>Filter by action type</li>
                  <li>Export logs to CSV</li>
                  <li>Verify all actions were logged</li>
                </ol>
              </div>

              <div className="flex gap-4 mt-6">
                <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C200]">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Start Testing
                </Button>
                <Button variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Test Checklist
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  )
}
