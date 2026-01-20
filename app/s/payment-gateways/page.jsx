"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAuthToken } from "@/lib/auth-service"
import {
  CreditCard,
  Plus,
  Settings,
  Check,
  X,
  AlertTriangle,
  Clock,
  Search,
  Edit,
  Smartphone,
  Building,
  Bitcoin,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Shield,
  RefreshCw,
  ChevronRight,
  Globe,
  Phone,
} from "lucide-react"

const GATEWAY_TYPES = {
  mpesa: { name: "M-Pesa", icon: Smartphone, type: "mobile_money", color: "#4CAF50", regions: ["africa"] },
  airtel_money: {
    name: "Airtel Money",
    icon: Smartphone,
    type: "mobile_money",
    color: "#E53935",
    regions: ["africa", "asia"],
  },
  mtn_money: { name: "MTN Money", icon: Smartphone, type: "mobile_money", color: "#FFCA28", regions: ["africa"] },
  ecocash: { name: "EcoCash", icon: Smartphone, type: "mobile_money", color: "#1976D2", regions: ["africa"] },
  opay: { name: "OPay", icon: Smartphone, type: "fintech", color: "#00C853", regions: ["africa"] },
  paystack: { name: "Paystack", icon: CreditCard, type: "fintech", color: "#00C2FF", regions: ["africa"] },
  flutterwave: {
    name: "Flutterwave",
    icon: CreditCard,
    type: "fintech",
    color: "#F5A623",
    regions: ["africa", "global"],
  },
  orange_money: { name: "Orange Money", icon: Smartphone, type: "mobile_money", color: "#FF6F00", regions: ["africa"] },
  airtime: {
    name: "Airtime Payment",
    icon: Phone,
    type: "airtime",
    color: "#9C27B0",
    regions: ["africa", "asia", "latam"],
  },
  crypto_usdt: { name: "USDT (Tether)", icon: Bitcoin, type: "crypto", color: "#26A17B", regions: ["global"] },
  crypto_btc: { name: "Bitcoin", icon: Bitcoin, type: "crypto", color: "#F7931A", regions: ["global"] },
  bank_transfer: { name: "Bank Transfer", icon: Building, type: "bank", color: "#5C6BC0", regions: ["global"] },
}

export default function PaymentGatewaysPage() {
  const [activeTab, setActiveTab] = useState("gateways")
  const [gateways, setGateways] = useState([])
  const [routes, setRoutes] = useState([])
  const [approvals, setApprovals] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAddGateway, setShowAddGateway] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(null)
  const [selectedGateway, setSelectedGateway] = useState(null)
  const [approvalFilter, setApprovalFilter] = useState("pending")

  // Form state for new gateway
  const [newGateway, setNewGateway] = useState({
    name: "",
    displayName: "",
    type: "mobile_money",
    status: "pending_setup",
    regions: [],
    currencies: ["USD"],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [gatewaysRes, routesRes, approvalsRes] = await Promise.all([
        fetch("/api/super/payment-gateways", { headers }),
        fetch("/api/super/payment-routes", { headers }),
        fetch(`/api/super/payment-approvals?status=${approvalFilter}`, { headers }),
      ])

      const [gatewaysData, routesData, approvalsData] = await Promise.all([
        gatewaysRes.json(),
        routesRes.json(),
        approvalsRes.json(),
      ])

      if (gatewaysData.success) {
        setGateways(gatewaysData.gateways || [])
        setStats(gatewaysData.stats || {})
      }
      if (routesData.success) {
        setRoutes(routesData.routes || [])
      }
      if (approvalsData.success) {
        setApprovals(approvalsData.approvals || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGateway = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch("/api/super/payment-gateways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGateway),
      })
      const data = await res.json()
      if (data.success) {
        setShowAddGateway(false)
        setNewGateway({
          name: "",
          displayName: "",
          type: "mobile_money",
          status: "pending_setup",
          regions: [],
          currencies: ["USD"],
        })
        fetchData()
      }
    } catch (error) {
      console.error("Error creating gateway:", error)
    }
  }

  const handleUpdateGateway = async (id, updates) => {
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/payment-gateways/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
        setShowConfigDialog(null)
      }
    } catch (error) {
      console.error("Error updating gateway:", error)
    }
  }

  const handleApprovalAction = async (id, action, notes = "") => {
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/super/payment-approvals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (error) {
      console.error("Error processing approval:", error)
    }
  }

  const formatCurrency = (amount) => {
    const rounded = Math.round((amount || 0) * 100) / 100
    if (rounded >= 1000000) return `$${(rounded / 1000000).toFixed(1)}M`
    if (rounded >= 1000) return `$${(rounded / 1000).toFixed(1)}K`
    return `$${rounded.toFixed(2)}`
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      pending_setup: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      maintenance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
      escalated: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    }
    return styles[status] || styles.inactive
  }

  const filteredGateways = gateways.filter(
    (g) =>
      g.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      g.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <SuperAdminLayout
      title="Payment Gateway Management"
      description="Manage payment providers, routing rules, and approvals"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#FFD700]/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-[#FFD700]" />
            </div>
            <span className="text-sm text-[#B8C5D6]">Active Gateways</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.activeGateways || 0} / {stats.totalGateways || 0}
          </p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-[#B8C5D6]">Today's Volume</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.todayDepositVolume + stats.todayWithdrawalVolume)}
          </p>
          <p className="text-xs text-[#B8C5D6] mt-1">
            {stats.todayDeposits || 0} deposits, {stats.todayWithdrawals || 0} withdrawals
          </p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-[#B8C5D6]">Pending Approvals</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingApprovals || 0}</p>
        </div>

        <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-[#B8C5D6]">Routing Rules</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.routingRules || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "gateways", label: "Payment Gateways", icon: CreditCard },
          { id: "routing", label: "Routing Rules", icon: ArrowRightLeft },
          { id: "fees", label: "Fee Management", icon: DollarSign },
          { id: "approvals", label: "Pending Approvals", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-[#FFD700] text-[#0A1A2F]" : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gateways Tab */}
      {activeTab === "gateways" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
              <Input
                placeholder="Search gateways..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-white"
              />
            </div>
            <Button
              onClick={() => setShowAddGateway(true)}
              className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
          </div>

          {/* Gateway Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(GATEWAY_TYPES).map(([key, gateway]) => {
              const configured = filteredGateways.find((g) => g.name === key)
              const Icon = gateway.icon

              return (
                <div
                  key={key}
                  className={`bg-[#0D1F35] border rounded-xl p-5 transition-all ${
                    configured?.status === "active"
                      ? "border-green-500/50"
                      : configured
                        ? "border-yellow-500/50"
                        : "border-[#2A3F55]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${gateway.color}20` }}>
                        <Icon className="w-6 h-6" style={{ color: gateway.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{gateway.name}</h3>
                        <p className="text-xs text-[#B8C5D6] capitalize">{gateway.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    {configured && (
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(configured.status)}`}>
                        {configured.status.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#B8C5D6] mb-4">
                    <Globe className="w-3 h-3" />
                    {gateway.regions.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
                  </div>

                  {configured ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#B8C5D6]">Deposit Fee</span>
                        <span className="text-white">
                          {configured.fees?.depositFeePercent || 0}%
                          {configured.fees?.depositFeeFixed > 0 && ` + $${configured.fees.depositFeeFixed}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#B8C5D6]">Withdrawal Fee</span>
                        <span className="text-white">
                          {configured.fees?.withdrawalFeePercent || 0}%
                          {configured.fees?.withdrawalFeeFixed > 0 && ` + $${configured.fees.withdrawalFeeFixed}`}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45] bg-transparent"
                          onClick={() => setShowConfigDialog(configured)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`border-[#2A3F55] ${
                            configured.status === "active"
                              ? "text-red-400 hover:bg-red-500/10"
                              : "text-green-400 hover:bg-green-500/10"
                          }`}
                          onClick={() =>
                            handleUpdateGateway(configured._id, {
                              status: configured.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {configured.status === "active" ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                      onClick={() => {
                        setNewGateway({
                          ...newGateway,
                          name: key,
                          displayName: gateway.name,
                          type: gateway.type,
                          regions: gateway.regions,
                        })
                        setShowAddGateway(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Setup Gateway
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Routing Rules Tab */}
      {activeTab === "routing" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Payment Routing Rules</h3>
            <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {routes.length > 0 ? (
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route._id} className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white">{route.name}</h4>
                      <p className="text-sm text-[#B8C5D6]">{route.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(route.status)}`}>
                        {route.status}
                      </span>
                      <span className="text-xs text-[#B8C5D6]">Priority: {route.priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#B8C5D6]">Type:</span>
                      <span className="text-white capitalize">{route.type}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B8C5D6]" />
                    <div className="flex items-center gap-2">
                      <span className="text-[#B8C5D6]">Primary:</span>
                      <span className="text-[#FFD700]">{route.primaryGateway?.displayName || "N/A"}</span>
                    </div>
                    {route.fallbackGateways?.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 text-[#B8C5D6]" />
                        <div className="flex items-center gap-2">
                          <span className="text-[#B8C5D6]">Fallbacks:</span>
                          <span className="text-white">{route.fallbackGateways.length}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-12 text-center">
              <ArrowRightLeft className="w-12 h-12 text-[#B8C5D6] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Routing Rules</h3>
              <p className="text-[#B8C5D6] mb-4">
                Create routing rules to automatically direct payments to the right gateway
              </p>
              <Button className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Fee Management Tab */}
      {activeTab === "fees" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Fee Configuration</h3>

          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1A2F45]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Gateway</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Deposit Fee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Withdrawal Fee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Min/Max Deposit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Min/Max Withdrawal</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#B8C5D6]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3F55]">
                {gateways
                  .filter((g) => g.status === "active")
                  .map((gateway) => (
                    <tr key={gateway._id} className="hover:bg-[#1A2F45]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{gateway.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {gateway.fees?.depositFeePercent || 0}%
                        {gateway.fees?.depositFeeFixed > 0 && ` + $${gateway.fees.depositFeeFixed}`}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {gateway.fees?.withdrawalFeePercent || 0}%
                        {gateway.fees?.withdrawalFeeFixed > 0 && ` + $${gateway.fees.withdrawalFeeFixed}`}
                      </td>
                      <td className="px-4 py-3 text-white">
                        ${gateway.limits?.minDeposit || 1} - ${gateway.limits?.maxDeposit || 10000}
                      </td>
                      <td className="px-4 py-3 text-white">
                        ${gateway.limits?.minWithdrawal || 5} - ${gateway.limits?.maxWithdrawal || 5000}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#B8C5D6] hover:text-white"
                          onClick={() => setShowConfigDialog(gateway)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {["pending", "escalated", "all"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setApprovalFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    approvalFilter === filter
                      ? "bg-[#FFD700] text-[#0A1A2F]"
                      : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <Button onClick={fetchData} variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {approvals.length > 0 ? (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <div key={approval._id} className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className={`px-2 py-1 text-xs rounded uppercase font-medium ${
                            approval.type === "deposit"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {approval.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusBadge(approval.status)}`}>
                          {approval.status}
                        </span>
                        {approval.riskScore > 50 && (
                          <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Risk: {approval.riskScore}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-white text-lg">
                        {formatCurrency(approval.amount)} {approval.currency}
                      </h4>
                    </div>
                    <div className="text-right text-sm text-[#B8C5D6]">
                      {new Date(approval.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-[#B8C5D6]">User:</span>
                      <p className="text-white">{approval.userId?.username || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[#B8C5D6]">Tenant:</span>
                      <p className="text-white">{approval.tenantId?.name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[#B8C5D6]">Gateway:</span>
                      <p className="text-white">{approval.gatewayName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[#B8C5D6]">Reason:</span>
                      <p className="text-white capitalize">{approval.reason?.replace(/_/g, " ") || "Manual Review"}</p>
                    </div>
                  </div>

                  {approval.paymentDetails && (
                    <div className="bg-[#1A2F45] rounded-lg p-3 mb-4 text-sm">
                      <span className="text-[#B8C5D6]">Payment Details: </span>
                      <span className="text-white">
                        {approval.paymentDetails.phoneNumber ||
                          approval.paymentDetails.accountNumber ||
                          approval.paymentDetails.walletAddress ||
                          "N/A"}
                      </span>
                    </div>
                  )}

                  {approval.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprovalAction(approval._id, "approve")}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleApprovalAction(approval._id, "reject")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                        onClick={() => handleApprovalAction(approval._id, "escalate")}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Escalate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-12 text-center">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
              <p className="text-[#B8C5D6]">No pending payment approvals at this time</p>
            </div>
          )}
        </div>
      )}

      {/* Add Gateway Dialog */}
      {showAddGateway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2A3F55] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Configure Payment Gateway</h2>
              <button onClick={() => setShowAddGateway(false)} className="text-[#B8C5D6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#B8C5D6] mb-2">Gateway</label>
                  <select
                    value={newGateway.name}
                    onChange={(e) => {
                      const gateway = GATEWAY_TYPES[e.target.value]
                      setNewGateway({
                        ...newGateway,
                        name: e.target.value,
                        displayName: gateway?.name || "",
                        type: gateway?.type || "mobile_money",
                        regions: gateway?.regions || [],
                      })
                    }}
                    className="w-full bg-[#1A2F45] border border-[#2A3F55] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select Gateway</option>
                    {Object.entries(GATEWAY_TYPES).map(([key, gateway]) => (
                      <option key={key} value={key}>
                        {gateway.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#B8C5D6] mb-2">Status</label>
                  <select
                    value={newGateway.status}
                    onChange={(e) => setNewGateway({ ...newGateway, status: e.target.value })}
                    className="w-full bg-[#1A2F45] border border-[#2A3F55] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="pending_setup">Pending Setup</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#2A3F55] pt-4">
                <h3 className="text-white font-medium mb-3">Deposit API Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter deposit API key"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">API Secret</label>
                    <Input
                      type="password"
                      placeholder="Enter deposit API secret"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#2A3F55] pt-4">
                <h3 className="text-white font-medium mb-3">Withdrawal API Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter withdrawal API key"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">API Secret</label>
                    <Input
                      type="password"
                      placeholder="Enter withdrawal API secret"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#2A3F55] pt-4">
                <h3 className="text-white font-medium mb-3">Fee Structure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Deposit Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Withdrawal Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2A3F55] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddGateway(false)}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGateway} className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90">
                Save Gateway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Gateway Dialog */}
      {showConfigDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2A3F55] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Configure {showConfigDialog.displayName}</h2>
              <button onClick={() => setShowConfigDialog(null)} className="text-[#B8C5D6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Fees Section */}
              <div>
                <h3 className="text-white font-medium mb-3">Fee Structure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Deposit Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      defaultValue={showConfigDialog.fees?.depositFeePercent || 0}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Deposit Fixed Fee ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={showConfigDialog.fees?.depositFeeFixed || 0}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Withdrawal Fee (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      defaultValue={showConfigDialog.fees?.withdrawalFeePercent || 0}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Withdrawal Fixed Fee ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={showConfigDialog.fees?.withdrawalFeeFixed || 0}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Limits Section */}
              <div>
                <h3 className="text-white font-medium mb-3">Transaction Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Min Deposit ($)</label>
                    <Input
                      type="number"
                      defaultValue={showConfigDialog.limits?.minDeposit || 1}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Max Deposit ($)</label>
                    <Input
                      type="number"
                      defaultValue={showConfigDialog.limits?.maxDeposit || 10000}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Min Withdrawal ($)</label>
                    <Input
                      type="number"
                      defaultValue={showConfigDialog.limits?.minWithdrawal || 5}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#B8C5D6] mb-2">Max Withdrawal ($)</label>
                    <Input
                      type="number"
                      defaultValue={showConfigDialog.limits?.maxWithdrawal || 5000}
                      className="bg-[#1A2F45] border-[#2A3F55] text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2A3F55] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfigDialog(null)}
                className="border-[#2A3F55] text-[#B8C5D6]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfigDialog(null)}
                className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
