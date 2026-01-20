"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Copy, Shield, Hash, Key, Layers } from "lucide-react"
import { toast } from "sonner"

export function ProvablyFairModal({ isOpen, onClose, roundData, onVerify }) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  const handleVerify = async () => {
    if (!roundData?.roundNumber) return

    setIsVerifying(true)
    try {
      const response = await fetch(`/api/sandbox/casino/verify?round=${roundData.roundNumber}`)
      const data = await response.json()

      if (data.success) {
        setVerificationResult(data.data)
        if (onVerify) onVerify(data.data)
      } else {
        toast.error(data.error || "Verification failed")
      }
    } catch (error) {
      toast.error("Failed to verify round")
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const provablyFair = verificationResult?.howToVerify || roundData?.provablyFair

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#FFD700] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Provably Fair Verification
          </DialogTitle>
          <DialogDescription className="text-[#B8C5D6]">
            Verify this game result was fair and not manipulated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Round Info */}
          <div className="bg-[#0A1A2F] rounded-lg p-4 border border-[#2A3F55]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#B8C5D6] text-sm">Round Number</span>
              <Badge variant="outline" className="border-[#FFD700] text-[#FFD700]">
                #{roundData?.roundNumber || "N/A"}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#B8C5D6] text-sm">Game Type</span>
              <span className="text-white font-medium capitalize">{roundData?.gameType || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#B8C5D6] text-sm">Result</span>
              <span className="text-white font-medium">{roundData?.result || "N/A"}</span>
            </div>
          </div>

          {/* Verification Status */}
          {verificationResult && (
            <div
              className={`rounded-lg p-4 border ${
                verificationResult.verification?.isValid
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {verificationResult.verification?.isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Verified Fair</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Verification Failed</span>
                  </>
                )}
              </div>
              <p className="text-[#B8C5D6] text-sm mt-2">
                {verificationResult.verification?.isValid
                  ? "This game result has been verified as fair using cryptographic proof."
                  : "The verification did not pass. Please contact support."}
              </p>
            </div>
          )}

          {/* Cryptographic Seeds */}
          {provablyFair && (
            <div className="space-y-3">
              <h4 className="text-[#F5F5F5] font-medium flex items-center gap-2">
                <Key className="w-4 h-4 text-[#FFD700]" />
                Cryptographic Seeds
              </h4>

              {/* Server Seed */}
              <div className="bg-[#0A1A2F] rounded-lg p-3 border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#B8C5D6] text-xs flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Server Seed
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(provablyFair.serverSeed, "Server Seed")}
                    className="h-6 px-2 text-[#8A9DB8] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <code className="text-xs text-green-400 break-all block">
                  {provablyFair.serverSeed || "Hidden until round ends"}
                </code>
              </div>

              {/* Server Seed Hash */}
              {provablyFair.serverSeedHash && (
                <div className="bg-[#0A1A2F] rounded-lg p-3 border border-[#2A3F55]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#B8C5D6] text-xs flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Server Seed Hash (SHA-256)
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(provablyFair.serverSeedHash, "Hash")}
                      className="h-6 px-2 text-[#8A9DB8] hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <code className="text-xs text-yellow-400 break-all block">{provablyFair.serverSeedHash}</code>
                </div>
              )}

              {/* Client Seed */}
              <div className="bg-[#0A1A2F] rounded-lg p-3 border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#B8C5D6] text-xs flex items-center gap-1">
                    <Key className="w-3 h-3" /> Client Seed
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(provablyFair.clientSeed, "Client Seed")}
                    className="h-6 px-2 text-[#8A9DB8] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <code className="text-xs text-blue-400 break-all block">{provablyFair.clientSeed}</code>
              </div>

              {/* Nonce */}
              <div className="bg-[#0A1A2F] rounded-lg p-3 border border-[#2A3F55]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#B8C5D6] text-xs flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Nonce (Round Number)
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(String(provablyFair.nonce), "Nonce")}
                    className="h-6 px-2 text-[#8A9DB8] hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <code className="text-xs text-purple-400 block">{provablyFair.nonce}</code>
              </div>
            </div>
          )}

          {/* How to Verify */}
          <div className="bg-[#0A1A2F]/50 rounded-lg p-4 border border-[#2A3F55]/50">
            <h4 className="text-[#F5F5F5] font-medium mb-3">How to Verify Independently</h4>
            <ol className="text-[#B8C5D6] text-sm space-y-2 list-decimal list-inside">
              <li>Copy the Server Seed, Client Seed, and Nonce above</li>
              <li>
                Combine them: <code className="text-yellow-400">clientSeed:nonce</code>
              </li>
              <li>
                Calculate: <code className="text-yellow-400">HMAC-SHA256(serverSeed, clientSeed:nonce)</code>
              </li>
              <li>Convert the first 8 hex characters to a number</li>
              <li>The result determines the game outcome</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-[#2A3F55]/50">
              <p className="text-[#8A9DB8] text-xs">
                You can use any HMAC-SHA256 calculator to verify. The hash before the game started proves we committed
                to the result before you played.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2A3F55] text-[#B8C5D6] bg-transparent"
            >
              Close
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isVerifying || !roundData?.roundNumber}
              className="flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A1A2F] border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Fairness
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
