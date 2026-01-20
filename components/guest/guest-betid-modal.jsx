"use client"

import { useEffect, useState } from "react"
import { Copy, QrCode, X, Check } from "lucide-react"
import { generateBetId } from "@/lib/guest-service"

export default function GuestBetIdModal({ isOpen, onClose, slip }) {
  const [betId, setBetId] = useState("")
  const [copied, setCopied] = useState(false)
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
    if (isOpen) {
      const newBetId = generateBetId()
      setBetId(newBetId)

      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      setExpiresAt(expiryTime.toLocaleString())
    }
  }, [isOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(betId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Your BetID</h2>

        {/* QR Code Area */}
        <div className="bg-muted rounded-lg p-4 mb-6 flex items-center justify-center">
          <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
            <QrCode size={100} className="text-primary" />
          </div>
        </div>

        {/* BetID Display */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Bet ID</p>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
            <code className="flex-1 font-mono text-lg font-semibold text-foreground">{betId}</code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-border rounded transition-colors"
              title="Copy BetID - Only BetID can be copied for security"
            >
              {copied ? (
                <Check size={18} className="text-secondary" />
              ) : (
                <Copy size={18} className="text-muted-foreground" />
              )}
            </button>
          </div>
          {copied && <p className="text-xs text-secondary mt-2">Copied to clipboard!</p>}
        </div>

        {/* Validity Information */}
        <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">Valid for 24 h or until odds change</p>
          <p className="text-foreground font-semibold">{expiresAt}</p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            Got It!
          </button>

          <button
            onClick={() => (window.location.href = "/auth")}
            className="w-full px-4 py-3 border border-secondary text-secondary rounded-lg font-semibold hover:bg-secondary/10 transition-colors"
          >
            Create a free account to save your slip
          </button>
        </div>
      </div>
    </div>
  )
}
