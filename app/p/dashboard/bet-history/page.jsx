"use client"

import { useState } from "react"
import { useBets } from "@/hooks/useBets"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/components/providers/tenant-provider"
import { useRouter } from "next/navigation"
import {
  Clock,
  Check,
  X,
  Loader2,
  FileText,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { BetReceiptModal } from "@/components/betting/bet-receipt-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", label: "Pending" },
  won: { icon: Check, color: "text-green-400", bg: "bg-green-500/10", label: "Won" },
  lost: { icon: X, color: "text-red-400", bg: "bg-red-500/10", label: "Lost" },
  void: { icon: X, color: "text-gray-400", bg: "bg-gray-500/10", label: "Void" },
  cashout: { icon: Check, color: "text-blue-400", bg: "bg-blue-500/10", label: "Cashed Out" },
}

export default function BetHistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { primaryColor } = useTenant()
  const [selectedBet, setSelectedBet] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { bets, pagination, isLoading, isError } = useBets({
    status: statusFilter,
    limit,
    page
  })

  const handleViewReceipt = (bet) => {
    setSelectedBet(bet)
    setReceiptOpen(true)
  }

  // Calculate statistics
  const stats = {
    total: pagination?.total || 0,
    won: bets.filter(b => b.status === "won").length,
    lost: bets.filter(b => b.status === "lost").length,
    pending: bets.filter(b => b.status === "pending").length,
    totalStaked: bets.reduce((sum, bet) => sum + (bet.stake || 0), 0),
    totalWinnings: bets.filter(b => b.status === "won").reduce((sum, bet) => sum + (bet.actualWin || bet.payout || 0), 0),
  }

  const profitLoss = stats.totalWinnings - stats.totalStaked
  const winRate = stats.total > 0 ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(1) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A1A2F]/95 backdrop-blur-sm border-b border-[#2A3F55]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-[#1A2F45] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#FFD700]">Bet History</h1>
                <p className="text-sm text-[#B8C5D6]">View all your betting activity</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2A3F55] text-[#F5F5F5]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#F5F5F5]">{stats.total}</div>
            <div className="text-sm text-[#B8C5D6]">Total Bets</div>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.won}</div>
            <div className="text-sm text-[#B8C5D6]">Won ({winRate}%)</div>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full ${profitLoss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                {profitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
            <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(profitLoss).toFixed(2)}
            </div>
            <div className="text-sm text-[#B8C5D6]">
              {profitLoss >= 0 ? 'Profit' : 'Loss'}
            </div>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#F5F5F5]">{stats.pending}</div>
            <div className="text-sm text-[#B8C5D6]">Pending</div>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === "all"
                  ? "bg-[#FFD700] text-[#0A1A2F]"
                  : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
              }`}
            >
              All
            </button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  statusFilter === status
                    ? `${config.bg} ${config.color}`
                    : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
                }`}
              >
                <config.icon className="w-4 h-4" />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bets List */}
        {isError ? (
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-8 text-center">
            <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-[#B8C5D6]">Failed to load bet history</p>
          </Card>
        ) : bets.length === 0 ? (
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55] p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A2F45] flex items-center justify-center">
              <FileText className="w-8 h-8 text-[#B8C5D6]" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">No Bets Found</h3>
            <p className="text-sm text-[#B8C5D6] mb-4">
              {statusFilter === "all"
                ? "You haven't placed any bets yet"
                : `No ${statusFilter} bets found`}
            </p>
            <Button
              onClick={() => router.push("/p/dashboard")}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0A1A2F] hover:opacity-90"
            >
              Start Betting
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {bets.map((bet) => {
                const StatusIcon = statusConfig[bet.status]?.icon || Clock
                const statusColor = statusConfig[bet.status]?.color || "text-gray-400"
                const statusBg = statusConfig[bet.status]?.bg || "bg-gray-500/10"
                const statusLabel = statusConfig[bet.status]?.label || bet.status

                return (
                  <Card key={bet._id} className="bg-[#1A2F45] border-[#2A3F55] p-4 hover:border-[#FFD700]/50 transition-colors">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusBg} ${statusColor} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabel}
                        </Badge>
                        <Badge variant="outline" className="border-[#2A3F55] text-[#B8C5D6] capitalize">
                          {bet.betType}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#B8C5D6]">
                          {new Date(bet.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-[#B8C5D6]">
                          {new Date(bet.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Bet ID */}
                    <div className="text-xs text-[#B8C5D6] mb-3">
                      Bet ID: <span className="text-[#FFD700] font-mono">{bet.betId || bet._id}</span>
                    </div>

                    {/* Selections */}
                    <div className="space-y-2 mb-4">
                      {bet.selections?.slice(0, 3).map((sel, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-[#0D1F35]/50 p-2 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#F5F5F5] truncate">{sel.eventName}</p>
                            <p className="text-xs text-[#B8C5D6] truncate">{sel.outcomeName}</p>
                          </div>
                          <span className="font-bold ml-2" style={{ color: primaryColor }}>
                            {sel.odds?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {bet.selections && bet.selections.length > 3 && (
                        <p className="text-xs text-[#B8C5D6] pl-2">
                          +{bet.selections.length - 3} more selections
                        </p>
                      )}
                    </div>

                    {/* Footer with Amounts */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#2A3F55] mb-3">
                      <div>
                        <p className="text-xs text-[#B8C5D6] mb-1">Stake</p>
                        <p className="text-sm font-semibold text-[#F5F5F5]">
                          {bet.currency} {bet.stake?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#B8C5D6] mb-1">Total Odds</p>
                        <p className="text-sm font-bold" style={{ color: primaryColor }}>
                          {bet.totalOdds?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#B8C5D6] mb-1">
                          {bet.status === "won" ? "Won" : "Potential Win"}
                        </p>
                        <p className={`text-sm font-bold ${bet.status === "won" ? "text-green-400" : ""}`} style={{ color: bet.status === "won" ? undefined : primaryColor }}>
                          {bet.currency} {(bet.status === "won" ? (bet.actualWin || bet.payout) : bet.potentialWin)?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* View Receipt Button */}
                    {(bet.status === "won" || bet.status === "lost" || bet.status === "void") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-[#2A3F55] text-[#F5F5F5] hover:bg-[#2A3F55]"
                        onClick={() => handleViewReceipt(bet)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Detailed Receipt
                      </Button>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-[#0D1F35]/80 border border-[#2A3F55] rounded-xl p-4">
                <div className="text-sm text-[#B8C5D6]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#2A3F55]"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#2A3F55]"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Receipt Modal */}
      <BetReceiptModal
        bet={selectedBet}
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false)
          setSelectedBet(null)
        }}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
