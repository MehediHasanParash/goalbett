"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, DollarSign, FileText, ArrowRight } from "lucide-react"

const ADJUSTMENT_REASONS = [
  { value: "correction", label: "Balance Correction" },
  { value: "bonus", label: "Bonus Credit" },
  { value: "refund", label: "Bet Refund" },
  { value: "promotion", label: "Promotional Credit" },
  { value: "compensation", label: "Customer Compensation" },
  { value: "error_fix", label: "System Error Fix" },
  { value: "chargeback", label: "Chargeback" },
  { value: "fraud", label: "Fraud Adjustment" },
  { value: "other", label: "Other (specify)" },
]

export function BalanceAdjustmentModal({
  isOpen,
  onClose,
  onConfirm,
  entityType = "player", // player, agent, tenant
  entityName,
  currentBalance = 0,
  currency = "USD",
}) {
  const [amount, setAmount] = useState("")
  const [adjustmentType, setAdjustmentType] = useState("add") // add or subtract
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const newBalance =
    adjustmentType === "add"
      ? currentBalance + Number.parseFloat(amount || 0)
      : currentBalance - Number.parseFloat(amount || 0)

  const handleSubmit = async () => {
    // Validation
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }
    if (!reason) {
      setError("Please select a reason for this adjustment")
      return
    }
    if (reason === "other" && !notes.trim()) {
      setError("Please provide details for 'Other' reason")
      return
    }
    if (newBalance < 0) {
      setError("Adjustment would result in negative balance")
      return
    }

    setLoading(true)
    setError("")

    try {
      await onConfirm({
        amount: Number.parseFloat(amount),
        type: adjustmentType,
        reason,
        notes,
        beforeBalance: currentBalance,
        afterBalance: newBalance,
      })

      // Reset form
      setAmount("")
      setReason("")
      setNotes("")
      setAdjustmentType("add")
      onClose()
    } catch (err) {
      setError(err.message || "Failed to process adjustment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#FFD700] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Balance Adjustment
          </DialogTitle>
          <DialogDescription className="text-[#B8C5D6]">
            Adjust balance for {entityType}: {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Balance Display */}
          <div className="bg-[#0A1A2F] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[#B8C5D6]">Current Balance</span>
              <span className="text-xl font-bold text-white">
                ${currentBalance.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <Label className="text-[#B8C5D6]">Adjustment Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
                className={
                  adjustmentType === "add"
                    ? "bg-green-600 hover:bg-green-700 flex-1"
                    : "border-[#2A3F55] text-[#B8C5D6] flex-1"
                }
              >
                + Add Credit
              </Button>
              <Button
                type="button"
                variant={adjustmentType === "subtract" ? "default" : "outline"}
                onClick={() => setAdjustmentType("subtract")}
                className={
                  adjustmentType === "subtract"
                    ? "bg-red-600 hover:bg-red-700 flex-1"
                    : "border-[#2A3F55] text-[#B8C5D6] flex-1"
                }
              >
                - Deduct
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label className="text-[#B8C5D6]">Amount ({currency})</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#0A1A2F] border-[#2A3F55] text-white mt-1"
            />
          </div>

          {/* New Balance Preview */}
          {amount && (
            <div className="bg-[#0A1A2F] rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-[#B8C5D6] mb-2">
                <span>Balance Change</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-lg text-white">${currentBalance.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4 text-[#FFD700]" />
                <span
                  className={`text-lg font-bold ${newBalance >= currentBalance ? "text-green-400" : "text-red-400"}`}
                >
                  ${newBalance.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Reason Selection - REQUIRED */}
          <div>
            <Label className="text-[#B8C5D6]">
              Reason <span className="text-red-400">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-[#0A1A2F] border-[#2A3F55] text-white mt-1">
                <SelectValue placeholder="Select reason for adjustment" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1F35] border-[#2A3F55]">
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-white">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div>
            <Label className="text-[#B8C5D6]">
              Notes {reason === "other" && <span className="text-red-400">*</span>}
            </Label>
            <Textarea
              placeholder="Provide additional details for audit trail..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#0A1A2F] border-[#2A3F55] text-white mt-1 min-h-[80px]"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-400 font-medium">Audit Trail Required</p>
              <p className="text-[#B8C5D6]">This action will be recorded with before/after values and your admin ID.</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2A3F55] text-[#B8C5D6] bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !amount || !reason}
              className="flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
            >
              <FileText className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
