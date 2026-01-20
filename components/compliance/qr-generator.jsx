"use client"

import { useState } from "react"
import { Download, Copy, Check } from "lucide-react"

export function QRGenerator({ betId, onDownload }) {
  const [copied, setCopied] = useState(false)

  const copyBetId = () => {
    navigator.clipboard.writeText(betId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Placeholder */}
      <div className="w-48 h-48 bg-white rounded-lg border-4 border-[#FFD700] flex items-center justify-center">
        <div className="text-6xl text-gray-300">▬▬▬▬▬</div>
      </div>

      {/* BetID Display */}
      <div className="w-full bg-[#1A2F45] rounded-lg p-4 border border-[#2A3F55]">
        <p className="text-xs text-[#B8C5D6] mb-2">BetID</p>
        <p className="text-lg font-mono font-bold text-[#FFD700] text-center mb-3">{betId}</p>
        <button
          onClick={copyBetId}
          className="w-full py-2 bg-[#FFD700] text-[#0A1A2F] rounded-lg font-bold hover:bg-[#FFD700]/90 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy BetID
            </>
          )}
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="w-full py-2 bg-[#2A3F55] text-[#B8C5D6] rounded-lg hover:bg-[#3A4F65] transition-all flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download QR Code
      </button>
    </div>
  )
}
