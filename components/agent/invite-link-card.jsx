"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Link2, Copy, Check, RefreshCw, Users, Share2, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function InviteLinkCard() {
  const [inviteData, setInviteData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInviteData()
  }, [])

  const fetchInviteData = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/invite", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setInviteData(data)
      }
    } catch (error) {
      console.error("Failed to fetch invite data:", error)
    } finally {
      setLoading(false)
    }
  }

  const regenerateCode = async () => {
    setRegenerating(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setInviteData((prev) => ({
          ...prev,
          inviteCode: data.inviteCode,
          inviteLink: data.inviteLink,
        }))
        toast({ title: "Success", description: "Invite code regenerated" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to regenerate code", variant: "destructive" })
    } finally {
      setRegenerating(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteData?.inviteLink || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied!", description: "Invite link copied to clipboard" })
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join My Agent Network",
          text: "Sign up as a sub-agent using my invite link!",
          url: inviteData?.inviteLink,
        })
      } catch (error) {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  if (loading) {
    return (
      <Card className="bg-[#0D1F35] border-[#2A3F55]">
        <CardContent className="p-6 text-center text-[#B8C5D6]">Loading invite data...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#0D1F35] border-[#2A3F55]">
      <CardHeader>
        <CardTitle className="text-[#FFD700] flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Your Invite Link
        </CardTitle>
        <CardDescription className="text-[#B8C5D6]">
          Share this link to recruit sub-agents to your network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Code */}
        <div className="flex items-center gap-2">
          <Badge className="bg-[#FFD700] text-[#0A1A2F] text-lg px-4 py-2 font-mono">
            {inviteData?.inviteCode || "------"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={regenerateCode}
            disabled={regenerating}
            className="text-[#B8C5D6] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Invite Link */}
        <div className="flex items-center gap-2">
          <Input
            value={inviteData?.inviteLink || ""}
            readOnly
            className="bg-[#0A1A2F] border-[#2A3F55] text-[#B8C5D6] font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyLink}
            className="border-[#2A3F55] bg-transparent text-[#B8C5D6] hover:text-white"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={shareLink} className="flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E6C200]">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>

          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#2A3F55] bg-transparent text-[#B8C5D6] hover:text-white">
                <QrCode className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0D1F35] border-[#2A3F55]">
              <DialogHeader>
                <DialogTitle className="text-[#FFD700]">Scan to Join</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 p-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={inviteData?.inviteLink || ""} size={200} />
                </div>
                <p className="text-[#B8C5D6] text-sm text-center">Scan this QR code to sign up as a sub-agent</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-[#2A3F55]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B8C5D6]">
              <Users className="w-4 h-4" />
              <span>Recruited Sub-Agents</span>
            </div>
            <Badge variant="secondary" className="bg-[#2A3F55] text-white">
              {inviteData?.inviteCount || 0}
            </Badge>
          </div>
        </div>

        {/* Recent Recruits */}
        {inviteData?.recruitedAgents?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[#B8C5D6]">Recent Recruits:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {inviteData.recruitedAgents.slice(0, 5).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between py-1 px-2 bg-[#1A2F45] rounded text-sm"
                >
                  <span className="text-white">{agent.name}</span>
                  <Badge variant={agent.isActive ? "default" : "secondary"} className="text-xs">
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
