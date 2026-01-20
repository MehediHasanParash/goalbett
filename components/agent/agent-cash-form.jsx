"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { createCashBet } from "@/lib/agent-service"

export default function AgentCashForm({ onClose }) {
  const [formData, setFormData] = useState({
    betId: "",
    amount: "",
    customerPhone: "",
  })
  const [receipt, setReceipt] = useState(null)
  const [errors, setErrors] = useState({})

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: "" })
  }

  const handleSubmit = () => {
    const newErrors = {}

    if (!formData.betId.match(/^GB-[A-Z0-9]{6}$/)) {
      newErrors.betId = "Invalid BetID format"
    }
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Create cash bet transaction
    const tx = createCashBet(formData.betId, Number.parseFloat(formData.amount), "MERCHANT_001")

    setReceipt(tx)
  }

  const handlePrint = () => {
    // Print receipt
    window.print()
  }

  if (receipt) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Receipt</h2>
            <p className="text-sm text-muted-foreground">Transaction confirmed</p>
          </div>

          <div className="bg-muted rounded-lg p-6 mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt ID:</span>
              <span className="text-foreground font-mono">{receipt.receiptUrl.receiptId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BetID:</span>
              <span className="text-foreground font-mono font-bold">{receipt.betId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="text-foreground font-bold">${receipt.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="text-foreground">{new Date(receipt.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="mb-6 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
            <div className="w-full h-32 bg-white rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-xs text-gray-600">QR Code</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              Done
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Accept Cash Bet</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">BetID</label>
            <input
              type="text"
              placeholder="GB-XXXXXX"
              value={formData.betId}
              onChange={handleInputChange("betId")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            {errors.betId && <p className="text-xs text-destructive mt-1">{errors.betId}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Cash Amount</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange("amount")}
                  className="w-full pl-7 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Customer Phone (optional)</label>
            <input
              type="tel"
              placeholder="+1-555-123-4567"
              value={formData.customerPhone}
              onChange={handleInputChange("customerPhone")}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              This bet will be recorded in your local cache and synced to the server when online.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
            >
              Accept & Record
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
