"use client"

import {
  CheckCircle,
  X,
  TrendingUp,
  DollarSign,
  Target,
  Share2,
  MessageCircle,
  Send,
  Phone,
  Copy,
  Check,
} from "lucide-react"
import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/auth-service"

export function BetSuccessModal({ betDetails, onClose }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareRecorded, setShareRecorded] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 50)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  if (!betDetails) return null

  const generateSlipMessage = () => {
    const selections =
      betDetails.selections
        ?.map(
          (sel, idx) =>
            `${idx + 1}. ${sel.match || sel.matchName || "Match"}\n   ${sel.selection || sel.betType} @ ${sel.odds}`,
        )
        .join("\n") || "No selections"

    const message = `🎫 *DIGITAL BET SLIP*
━━━━━━━━━━━━━━━━━━
📋 *Bet ID:* ${betDetails.betId}
━━━━━━━━━━━━━━━━━━

📌 *Selections:*
${selections}

━━━━━━━━━━━━━━━━━━
💰 *Stake:* $${betDetails.stake?.toFixed(2) || "0.00"}
📊 *Total Odds:* ${betDetails.totalOdds?.toFixed(2) || "0.00"}
🏆 *Potential Win:* $${betDetails.potentialWin?.toFixed(2) || "0.00"}
━━━━━━━━━━━━━━━━━━

✅ *Status:* ACCEPTED
📅 *Date:* ${new Date().toLocaleString()}

⚠️ Keep this slip as proof of your bet.
Present this to collect your winnings.

_Powered by GoalBett_`

    return message
  }

  const recordSlipShare = async (platform) => {
    try {
      await fetch("/api/agent/record-slip-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          betId: betDetails.betId,
          platform,
          sharedAt: new Date().toISOString(),
        }),
      })
      setShareRecorded(true)
    } catch (err) {
      console.error("[v0] Failed to record slip share:", err)
    }
  }

  const shareToWhatsApp = async () => {
    setSharing(true)
    const message = encodeURIComponent(generateSlipMessage())
    await recordSlipShare("whatsapp")
    window.open(`https://wa.me/?text=${message}`, "_blank")
    setSharing(false)
  }

  const shareToTelegram = async () => {
    setSharing(true)
    const message = encodeURIComponent(generateSlipMessage())
    await recordSlipShare("telegram")
    window.open(`https://t.me/share/url?url=&text=${message}`, "_blank")
    setSharing(false)
  }

  const shareToMessenger = async () => {
    setSharing(true)
    await recordSlipShare("messenger")
    // Messenger requires an app ID for full integration, using basic share
    const message = encodeURIComponent(generateSlipMessage())
    window.open(
      `https://www.facebook.com/dialog/send?link=https://goalbett.com&quote=${message}&app_id=YOUR_FB_APP_ID&redirect_uri=${window.location.href}`,
      "_blank",
    )
    setSharing(false)
  }

  const shareViaSMS = async () => {
    setSharing(true)
    const message = encodeURIComponent(generateSlipMessage().replace(/\*/g, "").replace(/━/g, "-"))
    await recordSlipShare("sms")
    window.open(`sms:?body=${message}`, "_blank")
    setSharing(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateSlipMessage().replace(/\*/g, ""))
      setCopied(true)
      await recordSlipShare("clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-gradient-to-br from-[#0D1F35] to-[#1A2F45] border-2 border-[#FFD700]/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          show ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#B8C5D6] hover:text-[#FFD700] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Success Icon with Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-[#FFD700] mb-2">Bet Accepted!</h2>
        <p className="text-center text-[#B8C5D6] mb-6">The bet has been successfully recorded</p>

        {/* Bet Details */}
        <div className="bg-[#0A1628]/50 rounded-xl p-6 space-y-4 border border-[#2A3F55]">
          {/* Bet ID */}
          <div className="text-center pb-4 border-b border-[#2A3F55]">
            <p className="text-xs text-[#B8C5D6] mb-1">BET ID</p>
            <p className="text-lg font-mono font-bold text-[#FFD700]">{betDetails.betId}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Total Odds */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-500/10 rounded-lg p-2">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-[#B8C5D6] mb-1">Total Odds</p>
              <p className="text-lg font-bold text-[#F5F5F5]">{betDetails.totalOdds?.toFixed(2) || "0.00"}</p>
            </div>

            {/* Stake */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-yellow-500/10 rounded-lg p-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-[#B8C5D6] mb-1">Stake</p>
              <p className="text-lg font-bold text-[#F5F5F5]">${betDetails.stake?.toFixed(2) || "0.00"}</p>
            </div>

            {/* Potential Win */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-green-500/10 rounded-lg p-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-[#B8C5D6] mb-1">Potential Win</p>
              <p className="text-lg font-bold text-green-400">${betDetails.potentialWin?.toFixed(2) || "0.00"}</p>
            </div>
          </div>

          {/* Selections */}
          {betDetails.selections && betDetails.selections.length > 0 && (
            <div className="pt-4 border-t border-[#2A3F55]">
              <p className="text-xs text-[#B8C5D6] mb-2">{betDetails.selections.length} SELECTION(S)</p>
              <div className="space-y-2">
                {betDetails.selections.slice(0, 2).map((sel, idx) => (
                  <div key={idx} className="bg-[#0D1F35]/50 rounded-lg p-2">
                    <p className="text-sm text-[#F5F5F5] font-medium">{sel.match || sel.matchName}</p>
                    <p className="text-xs text-[#B8C5D6]">
                      {sel.selection || sel.betType} @ {sel.odds}
                    </p>
                  </div>
                ))}
                {betDetails.selections.length > 2 && (
                  <p className="text-xs text-[#B8C5D6] text-center">
                    +{betDetails.selections.length - 2} more selection(s)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-[#0A1628]/50 rounded-xl border border-[#2A3F55]">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-[#FFD700]" />
            <h3 className="font-semibold text-[#F5F5F5]">Share Digital Slip</h3>
          </div>
          <p className="text-xs text-[#B8C5D6] mb-4">Send the bet slip to the player as proof of their bet</p>

          {/* Share Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              disabled={sharing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>

            {/* Telegram */}
            <button
              onClick={shareToTelegram}
              disabled={sharing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Telegram
            </button>

            {/* Messenger */}
            <button
              onClick={shareToMessenger}
              disabled={sharing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#00B2FF] to-[#006AFF] hover:from-[#00A0E6] hover:to-[#0060E6] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5" />
              Messenger
            </button>

            {/* SMS */}
            <button
              onClick={shareViaSMS}
              disabled={sharing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#5C6BC0] hover:bg-[#4A5AB8] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
              SMS
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-[#2A3F55] hover:bg-[#3A4F65] text-[#F5F5F5] font-semibold rounded-lg transition-all border border-[#3A4F65]"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Slip Text
              </>
            )}
          </button>

          {/* Share Status */}
          {shareRecorded && (
            <p className="text-xs text-green-400 text-center mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Slip sharing recorded for verification
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0D1F35] font-bold rounded-lg hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all transform hover:scale-[1.02]"
        >
          Done
        </button>

        {/* Info Text */}
        <p className="text-center text-xs text-[#B8C5D6] mt-4">Share the digital slip with the player before closing</p>
      </div>
    </div>
  )
}
