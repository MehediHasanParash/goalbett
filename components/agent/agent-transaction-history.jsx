"use client"

import { useState, useEffect } from "react"
import { Clock, Check, AlertCircle } from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function AgentTransactionHistory() {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="mx-auto text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-red-500 mb-4">Error loading transactions: {error}</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No transactions yet</p>
        <button className="px-4 py-2 border border-secondary text-secondary rounded-lg hover:bg-secondary/10 transition-colors">
          Start Accepting Bets
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">
                    {tx.betId || tx.transactionId || tx.id?.toString().slice(-6)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{tx.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-secondary">${tx.amount?.toFixed(2) || "0.00"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {tx.status === "completed" || tx.status === "active" ? (
                        <>
                          <Check size={16} className="text-green-500" />
                          <span className="text-green-500 capitalize">{tx.status}</span>
                        </>
                      ) : tx.status === "pending" ? (
                        <>
                          <Clock size={16} className="text-yellow-500" />
                          <span className="text-yellow-500">Pending</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-red-500" />
                          <span className="text-red-500 capitalize">{tx.status}</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
