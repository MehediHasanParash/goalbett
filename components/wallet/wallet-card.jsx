"use client"

import { useWallet } from "@/hooks/useWallet"
import { useTenant } from "@/components/providers/tenant-provider"
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useState } from "react"

export function WalletCard({ compact = false }) {
  const { wallet, recentTransactions, isLoading, isError, mutate } = useWallet()
  const { primaryColor } = useTenant()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="bg-[#1A2F45] rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-[#0A1A2F] rounded w-1/3 mb-4" />
        <div className="h-8 bg-[#0A1A2F] rounded w-1/2" />
      </div>
    )
  }

  if (isError || !wallet) {
    return (
      <div className="bg-[#1A2F45] rounded-xl p-4 text-center">
        <p className="text-[#B8C5D6] text-sm">Unable to load wallet</p>
        <button onClick={handleRefresh} className="mt-2 text-sm underline" style={{ color: primaryColor }}>
          Try again
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
        <Wallet className="w-5 h-5" style={{ color: primaryColor }} />
        <span className="font-bold" style={{ color: primaryColor }}>
          {wallet.currency} {wallet.balance.toFixed(2)}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#1A2F45] to-[#0A1A2F] rounded-xl p-6 border border-[#2A3F55]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Wallet className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-[#B8C5D6]">Available Balance</p>
            <p className="text-2xl font-bold text-[#F5F5F5]">
              {wallet.currency} {wallet.balance.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-[#2A3F55] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-[#B8C5D6] ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Bonus Balance */}
      {wallet.bonusBalance > 0 && (
        <div className="mb-4 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-400">Bonus Balance</span>
            <span className="font-bold text-amber-400">
              {wallet.currency} {wallet.bonusBalance.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Pending Withdrawal */}
      {wallet.pendingWithdrawal > 0 && (
        <div className="mb-4 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-400">Pending Withdrawal</span>
            <span className="font-bold text-orange-400">
              {wallet.currency} {wallet.pendingWithdrawal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions && recentTransactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2A3F55]">
          <p className="text-sm text-[#B8C5D6] mb-3">Recent Transactions</p>
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {tx.type === "deposit" || tx.type === "win" ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-[#F5F5F5] capitalize">{tx.type}</span>
                </div>
                <span className={tx.type === "deposit" || tx.type === "win" ? "text-green-400" : "text-red-400"}>
                  {tx.type === "deposit" || tx.type === "win" ? "+" : "-"}
                  {wallet.currency} {tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
