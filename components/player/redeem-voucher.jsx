"use client"

import { useState } from "react"
import { Ticket, RefreshCw, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAuthToken } from "@/lib/auth-service"

export default function RedeemVoucher({ onSuccess }) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [voucherInfo, setVoucherInfo] = useState(null)

  const validateCode = async () => {
    if (!code.trim()) return

    try {
      setValidating(true)
      setError("")
      setVoucherInfo(null)

      const token = getAuthToken()
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await res.json()

      if (data.success && data.valid) {
        setVoucherInfo(data.data)
      } else {
        setError(data.error || "Invalid voucher code")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setValidating(false)
    }
  }

  const handleRedeem = async () => {
    try {
      setLoading(true)
      setError("")

      const token = getAuthToken()
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(data.message)
        setCode("")
        setVoucherInfo(null)
        if (onSuccess) {
          onSuccess(data.data)
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#0D2137] border-[#FFD700]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#FFD700]">
          <Ticket className="h-5 w-5" />
          Redeem Voucher
        </CardTitle>
        <CardDescription className="text-[#F5F5F5]/70">
          Enter your voucher code to add funds to your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Enter voucher code (e.g., VCH-XXXX-XXXX)"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError("")
              setSuccess("")
              setVoucherInfo(null)
            }}
            className="bg-[#0A1A2F] border-[#FFD700]/20 text-white font-mono uppercase"
          />
          <Button
            variant="outline"
            onClick={validateCode}
            disabled={!code.trim() || validating}
            className="border-[#FFD700]/20 text-[#FFD700] bg-transparent"
          >
            {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Check"}
          </Button>
        </div>

        {voucherInfo && (
          <div className="p-4 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#F5F5F5]/70">Voucher Value:</span>
              <span className="text-2xl font-bold text-[#FFD700]">
                {voucherInfo.currency} {voucherInfo.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#F5F5F5]/50">Expires:</span>
              <span className="text-[#F5F5F5]/70">{new Date(voucherInfo.expiresAt).toLocaleDateString()}</span>
            </div>
            <Button
              onClick={handleRedeem}
              disabled={loading}
              className="w-full mt-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Redeem Voucher
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
