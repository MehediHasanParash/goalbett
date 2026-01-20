"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Share2, Download, Copy, Check, Trophy, Sparkles, Send } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

export function WinCardGenerator({ winData, onClose, isOpen = true }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    amount = 1000,
    game = "Sports Bet",
    multiplier = "2.5x",
    betId = "BET123456",
    playerName = "Player",
    timestamp = new Date().toISOString(),
    brandName = "GoalBett",
    eventName = "",
    odds = "",
  } = winData || {}

  const generateWinCard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsGenerating(true)
    const ctx = canvas.getContext("2d")
    const width = 600
    const height = 450
    canvas.width = width
    canvas.height = height

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#0A1A2F")
    gradient.addColorStop(0.5, "#122A45")
    gradient.addColorStop(1, "#0A1A2F")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Decorative corner elements
    ctx.strokeStyle = "#FFD70044"
    ctx.lineWidth = 2
    // Top left
    ctx.beginPath()
    ctx.moveTo(30, 50)
    ctx.lineTo(30, 30)
    ctx.lineTo(50, 30)
    ctx.stroke()
    // Top right
    ctx.beginPath()
    ctx.moveTo(width - 30, 50)
    ctx.lineTo(width - 30, 30)
    ctx.lineTo(width - 50, 30)
    ctx.stroke()
    // Bottom left
    ctx.beginPath()
    ctx.moveTo(30, height - 50)
    ctx.lineTo(30, height - 30)
    ctx.lineTo(50, height - 30)
    ctx.stroke()
    // Bottom right
    ctx.beginPath()
    ctx.moveTo(width - 30, height - 50)
    ctx.lineTo(width - 30, height - 30)
    ctx.lineTo(width - 50, height - 30)
    ctx.stroke()

    // Main border
    ctx.strokeStyle = "#FFD700"
    ctx.lineWidth = 3
    ctx.strokeRect(15, 15, width - 30, height - 30)

    // Trophy glow effect
    const glowGradient = ctx.createRadialGradient(width / 2, 80, 0, width / 2, 80, 60)
    glowGradient.addColorStop(0, "#FFD70033")
    glowGradient.addColorStop(1, "transparent")
    ctx.fillStyle = glowGradient
    ctx.fillRect(width / 2 - 60, 20, 120, 120)

    // Trophy emoji
    ctx.font = "48px Arial"
    ctx.textAlign = "center"
    ctx.fillText("🏆", width / 2, 95)

    // "BIG WIN!" text with glow
    ctx.shadowColor = "#FFD700"
    ctx.shadowBlur = 20
    ctx.fillStyle = "#FFD700"
    ctx.font = "bold 36px Arial"
    ctx.fillText("BIG WIN!", width / 2, 150)
    ctx.shadowBlur = 0

    // Amount with green color
    ctx.fillStyle = "#22c55e"
    ctx.font = "bold 60px Arial"
    ctx.fillText(`$${Number(amount).toLocaleString()}`, width / 2, 225)

    // Multiplier badge
    if (multiplier || odds) {
      ctx.fillStyle = "#FFD70022"
      const badgeWidth = 120
      ctx.beginPath()
      ctx.roundRect(width / 2 - badgeWidth / 2, 240, badgeWidth, 32, 16)
      ctx.fill()
      ctx.fillStyle = "#FFD700"
      ctx.font = "bold 18px Arial"
      ctx.fillText(odds || multiplier, width / 2, 262)
    }

    // Event/Game name
    if (eventName) {
      ctx.fillStyle = "#F5F5F5"
      ctx.font = "16px Arial"
      const truncatedEvent = eventName.length > 40 ? eventName.substring(0, 40) + "..." : eventName
      ctx.fillText(truncatedEvent, width / 2, 295)
    }

    // Game type
    ctx.fillStyle = "#B8C5D6"
    ctx.font = "14px Arial"
    ctx.fillText(game, width / 2, 320)

    // Separator line
    ctx.strokeStyle = "#2A3F55"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(100, 345)
    ctx.lineTo(width - 100, 345)
    ctx.stroke()

    // Player info
    ctx.fillStyle = "#FFD700"
    ctx.font = "bold 16px Arial"
    ctx.fillText(`@${playerName}`, width / 2, 375)

    // Date
    ctx.fillStyle = "#8A9DB8"
    ctx.font = "12px Arial"
    ctx.fillText(
      new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      width / 2,
      395,
    )

    // Brand watermark
    ctx.fillStyle = "#FFD700"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "right"
    ctx.fillText(brandName, width - 30, height - 25)

    // Bet ID
    ctx.fillStyle = "#8A9DB8"
    ctx.font = "10px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`ID: ${betId}`, 30, height - 25)

    // Verification badge
    ctx.fillStyle = "#22c55e"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.fillText("✓ Verified Win", width / 2, height - 25)

    // Convert to image URL
    setImageUrl(canvas.toDataURL("image/png"))
    setIsGenerating(false)
  }, [amount, game, multiplier, betId, playerName, timestamp, brandName, eventName, odds])

  useEffect(() => {
    if (winData) {
      generateWinCard()
    }
  }, [winData, generateWinCard])

  const downloadCard = () => {
    if (!imageUrl) return
    const link = document.createElement("a")
    link.download = `win-card-${betId}.png`
    link.href = imageUrl
    link.click()
  }

  const shareToTelegram = () => {
    const shareUrl = `${window.location.origin}?ref=${betId}`
    const text = `🏆 I just won $${Number(amount).toLocaleString()} on ${brandName}! ${multiplier || odds} odds! Join me and get a bonus!`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareToWhatsApp = () => {
    const shareUrl = `${window.location.origin}?ref=${betId}`
    const text = `🏆 I just won $${Number(amount).toLocaleString()} on ${brandName}! Join me: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareToTwitter = () => {
    const shareUrl = `${window.location.origin}?ref=${betId}`
    const text = `🏆 I just won $${Number(amount).toLocaleString()} on ${brandName}! ${multiplier || odds} odds!`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    )
  }

  const shareNative = async () => {
    if (!imageUrl) return

    try {
      const blob = await (await fetch(imageUrl)).blob()
      const file = new File([blob], "win-card.png", { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I won $${amount} on ${brandName}!`,
          text: `Check out my ${multiplier || odds} win on ${game}! 🏆`,
          files: [file],
          url: `${window.location.origin}?ref=${betId}`,
        })
      } else {
        copyLink()
      }
    } catch (error) {
      console.error("Share failed:", error)
      copyLink()
    }
  }

  const copyLink = () => {
    const shareUrl = `${window.location.origin}?ref=${betId}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const content = (
    <div className="space-y-4">
      {/* Canvas (hidden, used for generation) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      {imageUrl && !isGenerating && (
        <div className="rounded-lg overflow-hidden border border-[#2A3F55] shadow-lg shadow-[#FFD700]/10">
          <img src={imageUrl || "/placeholder.svg"} alt="Win Card" className="w-full" />
        </div>
      )}

      {isGenerating && (
        <div className="h-64 flex items-center justify-center bg-[#122A45] rounded-lg">
          <div className="animate-spin w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full" />
        </div>
      )}

      {/* QR Code */}
      <div className="flex items-center justify-center p-4 bg-white rounded-lg">
        <QRCodeSVG
          value={`${typeof window !== "undefined" ? window.location.origin : ""}?ref=${betId}`}
          size={120}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/icon.svg",
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <p className="text-center text-xs text-[#B8C5D6]">Scan to join and get a bonus!</p>

      {/* Social Share Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={shareToTelegram}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-[#0088cc] hover:bg-[#0077b5]"
        >
          <Send className="w-5 h-5" />
          <span className="text-xs">Telegram</span>
        </Button>
        <Button
          onClick={shareToWhatsApp}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-[#25D366] hover:bg-[#20bd5a]"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-xs">WhatsApp</span>
        </Button>
        <Button
          onClick={shareToTwitter}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-xs">X/Twitter</span>
        </Button>
        <Button
          onClick={shareNative}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E5C100]"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-xs">More</span>
        </Button>
      </div>

      {/* Download & Copy */}
      <div className="flex gap-2">
        <Button
          onClick={downloadCard}
          variant="outline"
          className="flex-1 border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={copyLink}
          variant="outline"
          className="border-[#2A3F55] text-white bg-transparent hover:bg-[#1A2F45]"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )

  // If used as a modal
  if (onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Share Your Win!
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  // If used as a standalone card
  return (
    <Card className="bg-[#0D1F35] border-[#2A3F55] max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-[#FFD700] flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Share Your Win!
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

export default WinCardGenerator
