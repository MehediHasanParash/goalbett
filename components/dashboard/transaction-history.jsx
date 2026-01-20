"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownCircle, ArrowUpCircle, Search, Filter, Download, Calendar, Loader2 } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export function TransactionHistory() {
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const token = getAuthToken()

        const response = await fetch("/api/agent/transactions?limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }

        const result = await response.json()
        if (result.success) {
          setTransactions(result.data || [])
        }
      } catch (err) {
        console.error("[v0] Error fetching transactions:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter((txn) => {
    const matchesType = filterType === "all" || txn.type === filterType
    const matchesSearch =
      (txn.player?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.betId?.toLowerCase().includes(searchTerm.toLowerCase())) ??
      false
    return matchesType && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-[#F5F5F5] flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-[#FFD700]" />
            Transaction History
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
            <Input
              placeholder="Search by player or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
              <Filter className="w-4 h-4 mr-2 text-[#B8C5D6]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
              <SelectItem value="all" className="text-[#F5F5F5]">
                All Transactions
              </SelectItem>
              <SelectItem value="deposit" className="text-[#F5F5F5]">
                Deposits
              </SelectItem>
              <SelectItem value="withdrawal" className="text-[#F5F5F5]">
                Withdrawals
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[#B8C5D6]">
              <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-50 animate-spin" />
              <p>Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>Error: {error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-[#B8C5D6]">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="bg-[#1A2F45] border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "deposit" || txn.type === "bet" ? "bg-green-500/20" : "bg-blue-500/20"
                      }`}
                    >
                      {txn.type === "deposit" || txn.type === "bet" ? (
                        <ArrowDownCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[#F5F5F5] font-semibold">{txn.player || "Guest"}</p>
                      <p className="text-[#B8C5D6] text-xs">
                        {txn.betId || txn.transactionId || txn.id?.toString().slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[#B8C5D6] text-xs">TYPE</p>
                    <p className="text-[#F5F5F5] capitalize">{txn.type}</p>
                  </div>

                  <div>
                    <p className="text-[#B8C5D6] text-xs">AMOUNT</p>
                    <p
                      className={`font-bold ${txn.type === "deposit" || txn.type === "bet" ? "text-green-400" : "text-blue-400"}`}
                    >
                      {txn.type === "deposit" || txn.type === "bet" ? "+" : "-"}${txn.amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#B8C5D6] text-xs">METHOD</p>
                    <p className="text-[#F5F5F5] text-sm">{txn.method || (txn.type === "bet" ? "Cash Bet" : "N/A")}</p>
                  </div>

                  <div>
                    <p className="text-[#B8C5D6] text-xs">STATUS</p>
                    <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
                  </div>

                  <div>
                    <p className="text-[#B8C5D6] text-xs">DATE</p>
                    <p className="text-[#F5F5F5] text-sm">{new Date(txn.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[#B8C5D6] text-sm">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent" disabled>
                Previous
              </Button>
              <Button size="sm" variant="outline" className="border-[#2A3F55] text-[#B8C5D6] bg-transparent">
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
