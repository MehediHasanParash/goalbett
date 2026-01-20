"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Download, Copy, Check, Receipt, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PrintSlipModal({ trigger, type, data }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slipData, setSlipData] = useState(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateSlip = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/print-slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, data }),
      })

      const result = await response.json()
      if (result.success) {
        setSlipData(result.slip)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate slip", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=300,height=600")
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Slip</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; font-weight: bold; font-size: 14px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .footer { text-align: center; margin-top: 16px; font-style: italic; }
            @media print {
              body { width: 58mm; }
            }
          </style>
        </head>
        <body>
          ${renderSlipHTML(slipData)}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(slipData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied", description: "Slip data copied to clipboard" })
  }

  const downloadPDF = () => {
    // Simple text-based download
    const content = renderSlipText(slipData)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `slip-${slipData?.slipId || "receipt"}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="border-[#2A3F55] bg-transparent text-[#B8C5D6] hover:text-white"
            onClick={generateSlip}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Slip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0D1F35] border-[#2A3F55] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#FFD700] flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Print Slip
          </DialogTitle>
        </DialogHeader>

        {!slipData ? (
          <div className="py-8 text-center">
            <Button
              onClick={generateSlip}
              disabled={loading}
              className="bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E6C200]"
            >
              {loading ? "Generating..." : "Generate Slip"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slip Preview */}
            <Card className="bg-white text-black font-mono text-xs">
              <CardContent className="p-4">
                <div className="text-center font-bold text-sm mb-2">{slipData.type}</div>
                <div className="border-t border-dashed border-gray-400 my-2" />

                <div className="space-y-1">
                  <div>Agent: {slipData.agent.name}</div>
                  <div>Brand: {slipData.agent.brand}</div>
                  <div>Date: {new Date(slipData.timestamp).toLocaleString()}</div>
                  <div>Slip: {slipData.slipId}</div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-2" />

                {slipData.transaction && (
                  <div className="space-y-1">
                    <div>Player: {slipData.transaction.playerName}</div>
                    <div className="font-bold">
                      Amount: {slipData.transaction.currency} {slipData.transaction.amount}
                    </div>
                    <div>Ref: {slipData.transaction.reference}</div>
                  </div>
                )}

                {slipData.bet && (
                  <div className="space-y-1">
                    <div>Player: {slipData.bet.playerName}</div>
                    <div>Bet ID: {slipData.bet.betId}</div>
                    {slipData.bet.selections?.map((s, i) => (
                      <div key={i} className="pl-2 text-xs">
                        {i + 1}. {s.event} - {s.selection} @{s.odds}
                      </div>
                    ))}
                    <div className="font-bold">
                      Stake: {slipData.bet.currency} {slipData.bet.stake}
                    </div>
                    <div className="font-bold text-green-600">
                      Potential: {slipData.bet.currency} {slipData.bet.potentialWin}
                    </div>
                  </div>
                )}

                {slipData.summary && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Deposits ({slipData.summary.deposits.count})</span>
                      <span>${slipData.summary.deposits.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Withdrawals ({slipData.summary.withdrawals.count})</span>
                      <span>${slipData.summary.withdrawals.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bets ({slipData.summary.bets.count})</span>
                      <span>${slipData.summary.bets.total}</span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-1" />
                    <div className="flex justify-between font-bold">
                      <span>Net Cashflow</span>
                      <span>${slipData.summary.netCashflow}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="text-center italic">{slipData.footer}</div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1 bg-[#FFD700] text-[#0A1A2F] hover:bg-[#E6C200]">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="flex-1 border-[#2A3F55] bg-transparent text-[#B8C5D6]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="border-[#2A3F55] bg-transparent text-[#B8C5D6]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function renderSlipHTML(slip) {
  if (!slip) return ""

  let html = `
    <div class="header">${slip.type}</div>
    <div class="divider"></div>
    <div>Agent: ${slip.agent.name}</div>
    <div>Brand: ${slip.agent.brand}</div>
    <div>Date: ${new Date(slip.timestamp).toLocaleString()}</div>
    <div>Slip: ${slip.slipId}</div>
    <div class="divider"></div>
  `

  if (slip.transaction) {
    html += `
      <div>Player: ${slip.transaction.playerName}</div>
      <div><strong>Amount: ${slip.transaction.currency} ${slip.transaction.amount}</strong></div>
      <div>Ref: ${slip.transaction.reference}</div>
    `
  }

  if (slip.bet) {
    html += `
      <div>Player: ${slip.bet.playerName}</div>
      <div>Bet ID: ${slip.bet.betId}</div>
      <div><strong>Stake: ${slip.bet.currency} ${slip.bet.stake}</strong></div>
      <div><strong>Potential: ${slip.bet.currency} ${slip.bet.potentialWin}</strong></div>
    `
  }

  if (slip.summary) {
    html += `
      <div class="row"><span>Deposits (${slip.summary.deposits.count})</span><span>$${slip.summary.deposits.total}</span></div>
      <div class="row"><span>Withdrawals (${slip.summary.withdrawals.count})</span><span>$${slip.summary.withdrawals.total}</span></div>
      <div class="row"><span>Bets (${slip.summary.bets.count})</span><span>$${slip.summary.bets.total}</span></div>
      <div class="divider"></div>
      <div class="row"><strong>Net Cashflow</strong><strong>$${slip.summary.netCashflow}</strong></div>
    `
  }

  html += `
    <div class="divider"></div>
    <div class="footer">${slip.footer}</div>
  `

  return html
}

function renderSlipText(slip) {
  if (!slip) return ""

  let text = `
================================
        ${slip.type}
================================
Agent: ${slip.agent.name}
Brand: ${slip.agent.brand}
Date: ${new Date(slip.timestamp).toLocaleString()}
Slip: ${slip.slipId}
--------------------------------
`

  if (slip.transaction) {
    text += `
Player: ${slip.transaction.playerName}
Amount: ${slip.transaction.currency} ${slip.transaction.amount}
Ref: ${slip.transaction.reference}
`
  }

  if (slip.bet) {
    text += `
Player: ${slip.bet.playerName}
Bet ID: ${slip.bet.betId}
Stake: ${slip.bet.currency} ${slip.bet.stake}
Potential Win: ${slip.bet.currency} ${slip.bet.potentialWin}
`
  }

  if (slip.summary) {
    text += `
Deposits: ${slip.summary.deposits.count} = $${slip.summary.deposits.total}
Withdrawals: ${slip.summary.withdrawals.count} = $${slip.summary.withdrawals.total}
Bets: ${slip.summary.bets.count} = $${slip.summary.bets.total}
--------------------------------
Net Cashflow: $${slip.summary.netCashflow}
`
  }

  text += `
--------------------------------
        ${slip.footer}
================================
`

  return text
}

// Quick print buttons for common actions
export function QuickPrintButtons() {
  const [loading, setLoading] = useState(null)
  const { toast } = useToast()

  const quickPrint = async (type) => {
    setLoading(type)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/agent/print-slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, data: {} }),
      })

      const result = await response.json()
      if (result.success) {
        // Auto-print
        const printWindow = window.open("", "_blank", "width=300,height=600")
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Slip</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
                .header { text-align: center; font-weight: bold; font-size: 14px; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .row { display: flex; justify-content: space-between; margin: 4px 0; }
                .footer { text-align: center; margin-top: 16px; font-style: italic; }
              </style>
            </head>
            <body>
              ${renderSlipHTML(result.slip)}
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `)
        printWindow.document.close()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to print", variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-[#2A3F55] bg-transparent text-[#B8C5D6] hover:text-white"
        onClick={() => quickPrint("daily_summary")}
        disabled={loading === "daily_summary"}
      >
        <Calendar className="w-4 h-4 mr-1" />
        {loading === "daily_summary" ? "..." : "Daily Summary"}
      </Button>
    </div>
  )
}
