const AGENT_CACHE_KEY = "agentTransactions"
const PENDING_SYNC_KEY = "agentPendingSync"

export const createCashBet = (betId, amount, merchantId) => {
  const transaction = {
    id: Date.now().toString(),
    betId,
    amount,
    merchantId,
    timestamp: new Date().toISOString(),
    status: "completed",
    type: "cash_bet",
    receiptUrl: generateReceipt(betId, amount, merchantId),
  }

  // Store in local cache
  const cache = JSON.parse(localStorage.getItem(AGENT_CACHE_KEY) || "[]")
  cache.push(transaction)
  localStorage.setItem(AGENT_CACHE_KEY, JSON.stringify(cache))

  return transaction
}

// Generate receipt QR (simplified)
export const generateReceipt = (betId, amount, merchantId) => {
  return {
    betId,
    amount,
    merchantId,
    timestamp: new Date().toISOString(),
    receiptId: `RCP-${Date.now()}`,
  }
}

// Get today's transactions
export const getTodayTransactions = () => {
  const cache = JSON.parse(localStorage.getItem(AGENT_CACHE_KEY) || "[]")
  const today = new Date().toDateString()

  return cache.filter((tx) => {
    const txDate = new Date(tx.timestamp).toDateString()
    return txDate === today
  })
}

// Offline sync management
export const addPendingSync = (transaction) => {
  const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]")
  pending.push({
    ...transaction,
    syncAttempts: 0,
    lastSyncError: null,
  })
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending))
}

export const getPendingSync = () => {
  return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]")
}

export const clearPendingSync = (transactionId) => {
  const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]")
  const updated = pending.filter((tx) => tx.id !== transactionId)
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated))
}

// Customer lookup
export const searchCustomer = (query) => {
  const cache = JSON.parse(localStorage.getItem(AGENT_CACHE_KEY) || "[]")

  return cache.filter((tx) => tx.betId.includes(query) || tx.phone?.includes(query))
}
