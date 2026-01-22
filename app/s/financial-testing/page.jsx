"use client"

import { useState, useCallback } from "react"
import { SuperAdminSidebar } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  Loader2,
  FileText,
  DollarSign,
  Shield,
  Globe,
  Wallet,
  Receipt,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

const TEST_CASES = [
  {
    id: "backend_enforcement",
    name: "1. Backend Tax/Charity Enforcement",
    description: "Test that taxes and charity are calculated and deducted in backend, not UI only",
    link: "/s/jurisdiction-rules",
    steps: [
      "Go to Jurisdiction Rules (/s/jurisdiction-rules)",
      "Create a rule for Ethiopia (ET) with 15% Win Tax (threshold 1000 ETB)",
      "Add 10% Charity deduction (threshold 500 ETB)",
      "Set status to Active and save",
      "Place a test bet and settle it as won",
      "Check that player receives NET amount (after deductions)",
      "Verify system accounts show deducted amounts",
    ],
  },
  {
    id: "ledger_audit",
    name: "2. Ledger / Audit Trail",
    description: "Test that every money movement is logged with full details",
    link: "/s/wallet-ledger",
    steps: [
      "Place a bet or make a deposit",
      "Go to Wallet Ledger (/s/wallet-ledger)",
      "Find the transaction in the ledger",
      "Verify it shows: user, amount, before/after balance, timestamp",
      "Check metadata shows all related info",
    ],
  },
  {
    id: "currency_validation",
    name: "3. One Currency Per Tenant",
    description: "Test that currency mismatches are rejected",
    link: "/s/tenant-management",
    steps: [
      "Note your tenant's default currency",
      "Try to place a bet with a different currency",
      "API should reject with 'Currency mismatch' error",
      "All UI should only show tenant's base currency",
    ],
  },
  {
    id: "threshold_rules",
    name: "4. Threshold-Based Country Rules",
    description: "Test that deductions only apply when threshold is met",
    link: "/s/jurisdiction-rules",
    steps: [
      "Create rule with Win Tax threshold = 1000 ETB",
      "Test Case A: Settle bet with gross win = 500 ETB -> Tax should NOT apply",
      "Test Case B: Settle bet with gross win = 1500 ETB -> Tax SHOULD apply",
      "Verify receipt shows correct deductions for each case",
    ],
  },
  {
    id: "rule_versioning",
    name: "5. Rule Versioning",
    description: "Test that old bets use old rules even after rule changes",
    link: "/s/jurisdiction-rules",
    steps: [
      "Create rule v1 with 10% tax",
      "Place a bet (bet A) under rule v1",
      "Update rule to 15% tax (creates v2)",
      "Place a new bet (bet B) under rule v2",
      "Settle bet A -> should use 10% tax (v1)",
      "Settle bet B -> should use 15% tax (v2)",
    ],
  },
  {
    id: "provider_lock",
    name: "6. Provider Templates & Locking",
    description: "Test that locked fields cannot be modified by tenants",
    link: "/s/jurisdiction-rules",
    steps: [
      "Create rule with providerLocked = true",
      "Try to modify the rule as a tenant admin",
      "Should see error or locked indicator",
      "Super admin should still be able to modify",
    ],
  },
  {
    id: "system_accounts",
    name: "7. Destination System Accounts",
    description: "Test that deductions go to correct system accounts",
    link: null,
    steps: [
      "Go to System Accounts section (this page, Accounts tab)",
      "Check existing accounts (Tax Payable, Charity Payable)",
      "Settle a bet with deductions",
      "Verify account balances increased",
      "Check ledger shows transfers to system accounts",
    ],
  },
  {
    id: "player_receipt",
    name: "8. Player Transparency Receipt",
    description: "Test that players see detailed breakdown after settlement",
    link: null,
    steps: [
      "Place and win a bet",
      "Use Receipt tab on this page to view breakdown",
      "Should show: stake, payout, gross win, each deduction, net amount",
      "Player should understand exactly what was deducted",
    ],
  },
  {
    id: "admin_audit",
    name: "9. Admin Audit Log",
    description: "Test that all admin changes are logged",
    link: "/s/audit-logs",
    steps: [
      "Make a change to jurisdiction rules",
      "Go to Audit Logs (/s/audit-logs)",
      "Find the change entry",
      "Should show: who, when, what changed, old/new values, reason",
    ],
  },
  {
    id: "staging_env",
    name: "10. Staging Environment",
    description: "Architecture supports staging environment",
    link: null,
    steps: [
      "Check NODE_ENV variable",
      "Staging requires separate DB and payment sandbox",
      "Contact admin to setup staging deployment",
      "Use preview/branch deployments for testing",
    ],
  },
]

export default function FinancialTestingPage() {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState({})
  const [activeTab, setActiveTab] = useState("overview")
  const [ledgerFilters, setLedgerFilters] = useState({ type: "", limit: 20 })
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [systemAccounts, setSystemAccounts] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [betIdInput, setBetIdInput] = useState("")

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }, [])

  const markTestResult = (testId, passed, message) => {
    setTestResults((prev) => ({
      ...prev,
      [testId]: { passed, message, timestamp: new Date().toISOString() },
    }))
  }

  const fetchLedger = async () => {
    setLoading((prev) => ({ ...prev, ledger: true }))
    try {
      const params = new URLSearchParams()
      if (ledgerFilters.type) params.append("type", ledgerFilters.type)
      params.append("limit", ledgerFilters.limit.toString())

      const res = await fetch(`/api/financial/ledger?${params}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setLedgerEntries(data.entries || [])
        toast.success(`Loaded ${data.entries?.length || 0} ledger entries`)
      } else {
        toast.error("Failed to fetch ledger")
      }
    } catch (error) {
      toast.error("Error fetching ledger: " + error.message)
    } finally {
      setLoading((prev) => ({ ...prev, ledger: false }))
    }
  }

  const fetchSystemAccounts = async () => {
    setLoading((prev) => ({ ...prev, accounts: true }))
    try {
      const res = await fetch("/api/financial/system-accounts", {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setSystemAccounts(data.accounts || [])
        toast.success(`Loaded ${data.accounts?.length || 0} system accounts`)
      } else {
        toast.error("Failed to fetch system accounts")
      }
    } catch (error) {
      toast.error("Error fetching accounts: " + error.message)
    } finally {
      setLoading((prev) => ({ ...prev, accounts: false }))
    }
  }

  const testCurrencyValidation = async () => {
    setLoading((prev) => ({ ...prev, currency: true }))
    try {
      const res = await fetch("/api/betting/place", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stake: 100,
          currency: "INVALID_CURRENCY_XYZ",
          selections: [{ eventId: "test", odds: 2.0 }],
        }),
      })
      const data = await res.json()

      if (!res.ok && (data.error?.toLowerCase().includes("currency") || data.message?.toLowerCase().includes("currency"))) {
        markTestResult("currency_validation", true, "Currency validation working - API rejected invalid currency")
        toast.success("Currency validation test PASSED")
      } else {
        markTestResult("currency_validation", false, "Currency validation may not be working properly")
        toast.error("Currency validation test FAILED")
      }
    } catch (error) {
      markTestResult("currency_validation", false, error.message)
      toast.error("Test error: " + error.message)
    } finally {
      setLoading((prev) => ({ ...prev, currency: false }))
    }
  }

  const fetchReceipt = async () => {
    if (!betIdInput) {
      toast.error("Please enter a bet ID")
      return
    }
    setLoading((prev) => ({ ...prev, receipt: true }))
    try {
      const res = await fetch(`/api/financial/player-receipt?betId=${betIdInput}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setReceipt(data.receipt)
        toast.success("Receipt loaded")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to fetch receipt")
      }
    } catch (error) {
      toast.error("Error: " + error.message)
    } finally {
      setLoading((prev) => ({ ...prev, receipt: false }))
    }
  }

  const passedCount = Object.values(testResults).filter((r) => r.passed).length
  const failedCount = Object.values(testResults).filter((r) => r.passed === false).length

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Financial Features Testing</h1>
              <p className="text-muted-foreground">
                Test all 10 critical financial features from the frontend
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset All
            </Button>
          </div>

          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertTitle>How to Use This Testing Page</AlertTitle>
            <AlertDescription>
              Each feature has step-by-step instructions. Click the link icons to navigate to the relevant pages.
              After testing, mark each feature as Passed or Failed. Use the Ledger, Accounts, and Receipt tabs
              for verification.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold">{TEST_CASES.length}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-green-600">{passedCount}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-red-600">{failedCount}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold">{TEST_CASES.length - passedCount - failedCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Test Checklist</TabsTrigger>
              <TabsTrigger value="ledger">Ledger Viewer</TabsTrigger>
              <TabsTrigger value="accounts">System Accounts</TabsTrigger>
              <TabsTrigger value="receipt">Player Receipt</TabsTrigger>
              <TabsTrigger value="quick">Quick Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {TEST_CASES.map((test) => (
                <Card
                  key={test.id}
                  className={
                    testResults[test.id]?.passed === true
                      ? "border-green-500 bg-green-500/5"
                      : testResults[test.id]?.passed === false
                        ? "border-red-500 bg-red-500/5"
                        : ""
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {testResults[test.id]?.passed === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {testResults[test.id]?.passed === false && <XCircle className="h-5 w-5 text-red-500" />}
                          {test.name}
                          {test.link && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => window.open(test.link, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={testResults[test.id]?.passed === true ? "default" : "outline"}
                          className={testResults[test.id]?.passed === true ? "bg-green-600" : "text-green-600 hover:bg-green-600 hover:text-white"}
                          onClick={() => markTestResult(test.id, true, "Manually marked as passed")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Pass
                        </Button>
                        <Button
                          size="sm"
                          variant={testResults[test.id]?.passed === false ? "default" : "outline"}
                          className={testResults[test.id]?.passed === false ? "bg-red-600" : "text-red-600 hover:bg-red-600 hover:text-white"}
                          onClick={() => markTestResult(test.id, false, "Manually marked as failed")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Fail
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-2">Steps to test:</p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      {test.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    {testResults[test.id] && (
                      <div className={`mt-3 p-2 rounded text-sm ${testResults[test.id].passed ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}`}>
                        {testResults[test.id].passed ? "PASSED" : "FAILED"}: {testResults[test.id].message}
                        <span className="text-xs ml-2">({new Date(testResults[test.id].timestamp).toLocaleTimeString()})</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="ledger" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Financial Ledger
                  </CardTitle>
                  <CardDescription>View all transaction entries with before/after balances</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Transaction Type</Label>
                      <Select value={ledgerFilters.type} onValueChange={(v) => setLedgerFilters((prev) => ({ ...prev, type: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          <SelectItem value="bet_won">Bet Won</SelectItem>
                          <SelectItem value="bet_lost">Bet Lost</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="system_account">System Account Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Limit</Label>
                      <Input type="number" value={ledgerFilters.limit} onChange={(e) => setLedgerFilters((prev) => ({ ...prev, limit: parseInt(e.target.value) || 20 }))} />
                    </div>
                    <Button onClick={fetchLedger} disabled={loading.ledger}>
                      {loading.ledger ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Fetch
                    </Button>
                  </div>

                  {ledgerEntries.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-left">Amount</th>
                            <th className="p-3 text-left">Before</th>
                            <th className="p-3 text-left">After</th>
                            <th className="p-3 text-left">Description</th>
                            <th className="p-3 text-left">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerEntries.map((entry, i) => (
                            <tr key={entry._id || i} className="border-t hover:bg-muted/50">
                              <td className="p-3"><Badge variant="outline">{entry.type}</Badge></td>
                              <td className="p-3 font-mono">{entry.amount?.toLocaleString()} {entry.currency}</td>
                              <td className="p-3 font-mono text-muted-foreground">{entry.beforeBalance?.toLocaleString()}</td>
                              <td className="p-3 font-mono">{entry.afterBalance?.toLocaleString()}</td>
                              <td className="p-3 text-xs max-w-xs truncate">{entry.description}</td>
                              <td className="p-3 text-muted-foreground text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      No ledger entries loaded. Click "Fetch" to load transactions.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    System Accounts
                  </CardTitle>
                  <CardDescription>Tax Payable, Charity Payable, and other destination accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={fetchSystemAccounts} disabled={loading.accounts}>
                    {loading.accounts ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Load System Accounts
                  </Button>

                  {systemAccounts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {systemAccounts.map((account) => (
                        <Card key={account._id} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{account.accountName}</p>
                                <Badge variant="outline" className="mt-1 text-xs">{account.accountType}</Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">{account.balance?.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{account.currency}</p>
                              </div>
                            </div>
                            {account.lastUpdated && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Updated: {new Date(account.lastUpdated).toLocaleString()}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      No system accounts found. They will be auto-created when first settlement occurs.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Player Receipt Viewer
                  </CardTitle>
                  <CardDescription>View detailed settlement breakdown for any bet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Bet ID</Label>
                      <Input
                        placeholder="Enter bet ID to view receipt..."
                        value={betIdInput}
                        onChange={(e) => setBetIdInput(e.target.value)}
                      />
                    </div>
                    <Button onClick={fetchReceipt} disabled={loading.receipt || !betIdInput}>
                      {loading.receipt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Get Receipt
                    </Button>
                  </div>

                  {receipt && (
                    <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Settlement Receipt
                        </CardTitle>
                        <CardDescription>Bet ID: {receipt.betId}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-background rounded">
                            <p className="text-xs text-muted-foreground">Stake</p>
                            <p className="text-lg font-semibold">{receipt.stake?.toLocaleString()} {receipt.currency}</p>
                          </div>
                          <div className="p-3 bg-background rounded">
                            <p className="text-xs text-muted-foreground">Payout</p>
                            <p className="text-lg font-semibold">{receipt.payout?.toLocaleString()} {receipt.currency}</p>
                          </div>
                          <div className="p-3 bg-background rounded">
                            <p className="text-xs text-muted-foreground">Gross Win</p>
                            <p className="text-lg font-semibold text-blue-600">{receipt.grossWin?.toLocaleString()} {receipt.currency}</p>
                          </div>
                          <div className="p-3 bg-background rounded">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={receipt.status === "settled" ? "default" : "secondary"}>{receipt.status}</Badge>
                          </div>
                        </div>

                        {receipt.deductions?.length > 0 && (
                          <div className="border-t pt-4">
                            <p className="font-semibold mb-3">Deductions Applied:</p>
                            <div className="space-y-2">
                              {receipt.deductions.map((d, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-red-500/5 rounded">
                                  <div>
                                    <span className="font-medium">{d.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">({d.percentage}% of {d.calculationBase})</span>
                                  </div>
                                  <span className="font-mono text-red-600">-{d.amount?.toLocaleString()} {receipt.currency}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center p-2 bg-red-500/10 rounded font-semibold">
                                <span>Total Deductions</span>
                                <span className="text-red-600">-{receipt.totalDeductions?.toLocaleString()} {receipt.currency}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                            <span className="text-lg font-bold">Net Amount Credited</span>
                            <span className="text-2xl font-bold text-green-600">{receipt.netAmount?.toLocaleString()} {receipt.currency}</span>
                          </div>
                        </div>

                        {receipt.appliedRule && (
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            Applied Rule: {receipt.appliedRule.countryCode} v{receipt.appliedRule.version} (ID: {receipt.appliedRule.id})
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Currency Validation Test</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically tests if API rejects bets with invalid currency
                    </p>
                    <Button onClick={testCurrencyValidation} disabled={loading.currency} className="w-full">
                      {loading.currency ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      Run Currency Test
                    </Button>
                    {testResults.currency_validation && (
                      <div className={`mt-3 p-2 rounded text-sm ${testResults.currency_validation.passed ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}`}>
                        {testResults.currency_validation.passed ? "PASSED" : "FAILED"}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Jurisdiction Rules</h4>
                    <p className="text-sm text-muted-foreground mb-4">Create and manage country-specific financial rules</p>
                    <Button variant="outline" className="w-full" onClick={() => window.open("/s/jurisdiction-rules", "_blank")}>
                      <Globe className="h-4 w-4 mr-2" />
                      Open Rules Page
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Audit Logs</h4>
                    <p className="text-sm text-muted-foreground mb-4">View who changed what and when</p>
                    <Button variant="outline" className="w-full" onClick={() => window.open("/s/audit-logs", "_blank")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Open Audit Logs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Wallet Ledger</h4>
                    <p className="text-sm text-muted-foreground mb-4">Complete transaction history with balances</p>
                    <Button variant="outline" className="w-full" onClick={() => window.open("/s/wallet-ledger", "_blank")}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Open Wallet Ledger
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
