"use client"

import { useState, useCallback, useEffect } from "react"
import { getAuthToken } from "@/lib/auth-service"

// Local storage key for guest betslip
const BETSLIP_STORAGE_KEY = "v0_betslip"

// Hook for managing betslip state with API sync
export function useBetSlip() {
  const [selections, setSelections] = useState([])
  const [betType, setBetType] = useState("single")
  const [stakes, setStakes] = useState({})
  const [totalStake, setTotalStake] = useState(0)
  const [isPlacing, setIsPlacing] = useState(false)

  const token = getAuthToken()
  const isAuthenticated = !!token

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(BETSLIP_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSelections(parsed.selections || [])
        setBetType(parsed.betType || "single")
        setStakes(parsed.stakes || {})
        setTotalStake(parsed.totalStake || 0)
      } catch (e) {
        console.error("Error loading betslip:", e)
      }
    }
  }, [])

  // Save to local storage on change
  useEffect(() => {
    const data = { selections, betType, stakes, totalStake }
    localStorage.setItem(BETSLIP_STORAGE_KEY, JSON.stringify(data))
  }, [selections, betType, stakes, totalStake])

  // Add selection
  const addSelection = useCallback(
    (selection) => {
      setSelections((prev) => {
        // Check if event already in betslip (replace selection for same event)
        const existingIndex = prev.findIndex((s) => s.eventId === selection.eventId)

        if (existingIndex >= 0) {
          // Replace existing selection
          const updated = [...prev]
          updated[existingIndex] = selection
          return updated
        }

        return [...prev, selection]
      })

      // Auto switch to multiple if more than 1 selection
      if (selections.length >= 1) {
        setBetType("multiple")
      }
    },
    [selections.length],
  )

  // Remove selection
  const removeSelection = useCallback(
    (eventId) => {
      setSelections((prev) => prev.filter((s) => s.eventId !== eventId))

      // Switch back to single if 1 or less selections
      if (selections.length <= 2) {
        setBetType("single")
      }
    },
    [selections.length],
  )

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelections([])
    setStakes({})
    setTotalStake(0)
    setBetType("single")
    localStorage.removeItem(BETSLIP_STORAGE_KEY)
  }, [])

  // Update stake for single bets
  const updateStake = useCallback((eventId, stake) => {
    setStakes((prev) => ({
      ...prev,
      [eventId]: stake,
    }))
  }, [])

  // Calculate total odds
  const calculateTotalOdds = useCallback(() => {
    if (selections.length === 0) return 0

    if (betType === "single") {
      return selections.reduce((sum, s) => sum + s.odds, 0)
    }

    // Multiple - multiply all odds
    return selections.reduce((product, s) => product * s.odds, 1)
  }, [selections, betType])

  // Calculate potential win
  const calculatePotentialWin = useCallback(() => {
    if (selections.length === 0) return 0

    if (betType === "single") {
      // Sum of individual potential wins
      return Object.entries(stakes).reduce((sum, [eventId, stake]) => {
        const selection = selections.find((s) => s.eventId === eventId)
        if (selection && stake) {
          return sum + stake * selection.odds
        }
        return sum
      }, 0)
    }

    // Multiple - totalStake * totalOdds
    return totalStake * calculateTotalOdds()
  }, [selections, betType, stakes, totalStake, calculateTotalOdds])

  // Calculate total stake
  const calculateTotalStake = useCallback(() => {
    if (betType === "single") {
      return Object.values(stakes).reduce((sum, stake) => sum + (stake || 0), 0)
    }
    return totalStake
  }, [betType, stakes, totalStake])

  // Place bet
  const placeBet = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Please login to place bets")
    }

    if (selections.length === 0) {
      throw new Error("No selections in betslip")
    }

    const stakeAmount = calculateTotalStake()
    if (stakeAmount <= 0) {
      throw new Error("Please enter a stake amount")
    }

    setIsPlacing(true)

    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selections,
          stake: stakeAmount,
          betType,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to place bet")
      }

      // Clear betslip on success
      clearSelections()

      return data.data
    } finally {
      setIsPlacing(false)
    }
  }, [isAuthenticated, selections, calculateTotalStake, betType, token, clearSelections])

  // Check if event is in betslip
  const isInBetslip = useCallback(
    (eventId) => {
      return selections.some((s) => s.eventId === eventId)
    },
    [selections],
  )

  // Get selection for event
  const getSelection = useCallback(
    (eventId) => {
      return selections.find((s) => s.eventId === eventId)
    },
    [selections],
  )

  return {
    selections,
    betType,
    setBetType,
    stakes,
    totalStake,
    setTotalStake,
    addSelection,
    removeSelection,
    clearSelections,
    updateStake,
    totalOdds: calculateTotalOdds(),
    potentialWin: calculatePotentialWin(),
    totalStakeAmount: calculateTotalStake(),
    placeBet,
    isPlacing,
    isInBetslip,
    getSelection,
    selectionCount: selections.length,
  }
}
