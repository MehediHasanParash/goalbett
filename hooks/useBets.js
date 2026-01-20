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

// Hook to get user's bets
export function useBets(options = {}) {
  const { status = "all", limit = 50, page = 1 } = options

  const url = `/api/bets?status=${status}&limit=${limit}&page=${page}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcherWithAuth, {
    revalidateOnFocus: true,
  })

  return {
    bets: data?.data || [],
    pagination: data?.pagination || {},
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get single bet details
export function useBet(betId) {
  const { data, error, isLoading, mutate } = useSWR(betId ? `/api/bets/${betId}` : null, fetcherWithAuth, {
    revalidateOnFocus: false,
  })

  return {
    bet: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook to get betting history with stats
export function useBetHistory(period = "all") {
  const { data, error, isLoading, mutate } = useSWR(`/api/bets/history?period=${period}`, fetcherWithAuth, {
    revalidateOnFocus: false,
  })

  return {
    stats: data?.data?.stats || null,
    recentBets: data?.data?.recentBets || [],
    period: data?.data?.period,
    isLoading,
    isError: error,
    mutate,
  }
}

// Function to place a bet
export async function placeBet(selections, stake, betType = "single") {
  const token = getAuthToken()
  if (!token) throw new Error("Not authenticated")

  const res = await fetch("/api/bets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ selections, stake, betType }),
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.error)
  return data
}
