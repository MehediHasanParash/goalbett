"use client"

import { useState, useCallback, useMemo } from "react"
import { useBetSlip } from "@/hooks/useBetSlip"

export { useBetSlip }

export function useBetState() {
  const betSlipState = useBetSlip()

  const transformedBets = useMemo(
    () =>
      betSlipState.selections.map((selection) => ({
        ...selection,
        id: selection.eventId,
        stake: betSlipState.stakes[selection.eventId] || 0,
      })),
    [betSlipState.selections, betSlipState.stakes],
  )

  return {
    bets: transformedBets,
    // Map function names
    addBet: betSlipState.addSelection,
    removeBet: betSlipState.removeSelection,
    clearBets: betSlipState.clearSelections,
    updateStake: betSlipState.updateStake,
    // Pass through other properties
    ...betSlipState,
  }
}

export function useBetHistory() {
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")

  const getFilteredBets = useCallback(() => {
    if (filter === "all") return bets
    if (filter === "open") return bets.filter((b) => b.status === "open")
    if (filter === "settled") return bets.filter((b) => b.status === "settled")
    if (filter === "cashout") return bets.filter((b) => b.canCashout)
    return bets
  }, [bets, filter])

  return {
    bets,
    setBets,
    loading,
    setLoading,
    filter,
    setFilter,
    filteredBets: getFilteredBets(),
  }
}
