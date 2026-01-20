"use client"

import useSWR from "swr"
import { getAuthToken } from "@/lib/auth-service"

const fetcherWithAuth = async (url) => {
  const token = getAuthToken()
  if (!token) throw new Error("Not authenticated")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR("/api/user/wallet", fetcherWithAuth, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  })

  // Fetch transactions
  const { data: txData } = useSWR("/api/wallet/transactions?limit=10", fetcherWithAuth, {
    revalidateOnFocus: false,
  })

  // Deposit function
  const deposit = async (amount, paymentMethod = "card") => {
    const token = getAuthToken()
    if (!token) throw new Error("Not authenticated")

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, paymentMethod }),
    })

    const result = await res.json()
    if (!result.success) throw new Error(result.error)

    await mutate()
    return result
  }

  // Withdraw function
  const withdraw = async (amount, paymentMethod = "bank") => {
    const token = getAuthToken()
    if (!token) throw new Error("Not authenticated")

    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, paymentMethod }),
    })

    const result = await res.json()
    if (!result.success) throw new Error(result.error)

    await mutate()
    return result
  }

  return {
    wallet: data?.data?.wallet || null,
    transactions: txData?.data || data?.data?.recentTransactions || [],
    isLoading,
    error,
    deposit,
    withdraw,
    refreshWallet: mutate,
  }
}

// Hook to get transactions with filters
export function useTransactions(options = {}) {
  const { type = null, status = null, limit = 50, page = 1 } = options

  let url = `/api/wallet/transactions?limit=${limit}&page=${page}`
  if (type) url += `&type=${type}`
  if (status) url += `&status=${status}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcherWithAuth, {
    revalidateOnFocus: false,
  })

  return {
    transactions: data?.data || [],
    pagination: data?.pagination || {},
    isLoading,
    isError: error,
    mutate,
  }
}
