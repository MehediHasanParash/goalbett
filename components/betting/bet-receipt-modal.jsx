"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, FileText, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function BetReceiptModal({ bet, open, onClose }) {
  if (!bet) return null

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "won":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "lost":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Bet Receipt - ${bet.ticketNumber}`,
        text: `Bet: ${bet.ticketNumber}\nStatus: ${bet.status}\nStake: ${formatCurrency(bet.stake, bet.currency)}\nNet Win: ${formatCurrency(bet.actualWin || 0, bet.currency)}`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bet Receipt
          </DialogTitle>
          <DialogDescription>Complete breakdown of your bet settlement</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{bet.ticketNumber}</h3>
                <p className="text-sm text-muted-foreground">{format(new Date(bet.createdAt), "PPpp")}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(bet.status)}
                <Badge variant={bet.status === "won" ? "default" : bet.status === "lost" ? "destructive" : "secondary"}>
                  {bet.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Selections</h4>
              {bet.selections?.map((selection, index) => (
                <div key={index} className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{selection.eventName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selection.marketName}: <span className="font-medium">{selection.selectionName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{selection.odds?.toFixed(2)}</p>
                      {selection.status && (
                        <Badge variant="outline" className="mt-1">
                          {selection.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3">Financial Breakdown</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stake Amount</span>
                <span className="font-medium">{formatCurrency(bet.stake, bet.currency)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total Odds</span>
                <span className="font-medium">{bet.totalOdds?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Potential Payout</span>
                <span className="font-medium">{formatCurrency(bet.potentialWin, bet.currency)}</span>
              </div>

              {bet.status === "won" && bet.taxDetails && (
                <>
                  <Separator className="my-3" />

                  <div className="flex justify-between text-sm font-semibold">
                    <span>Gross Winnings</span>
                    <span className="text-green-600">{formatCurrency(bet.taxDetails.grossWin, bet.currency)}</span>
                  </div>

                  {bet.taxDetails.deductions && bet.taxDetails.deductions.length > 0 && (
                    <>
                      <Separator className="my-2" />

                      <h5 className="text-xs font-semibold text-muted-foreground mt-2">DEDUCTIONS APPLIED</h5>

                      {bet.taxDetails.deductions.map((deduction, index) => (
                        <div key={index} className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">
                              {deduction.name.replace(/_/g, " ")} ({deduction.percentage}%)
                            </span>
                            <span className="font-medium text-red-600">
                              -{formatCurrency(deduction.amount, bet.currency)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {deduction.percentage}% of {deduction.calculationBase.replace(/_/g, " ")} (
                            {formatCurrency(deduction.baseAmount, bet.currency)})
                          </p>
                        </div>
                      ))}

                      <Separator className="my-2" />

                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Total Deductions</span>
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(bet.taxDetails.totalDeductions, bet.currency)}
                        </span>
                      </div>
                    </>
                  )}

                  <Separator className="my-3" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Amount Credited</span>
                    <span className="text-green-600">
                      {formatCurrency(bet.stake + (bet.taxDetails.netWin || 0), bet.currency)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Jurisdiction: {bet.taxDetails.countryCode} | Rule Version: v{bet.taxDetails.ruleVersion}
                  </p>
                </>
              )}

              {bet.status === "lost" && (
                <>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Result</span>
                    <span className="text-red-600">{formatCurrency(0, bet.currency)}</span>
                  </div>
                </>
              )}

              {bet.status === "pending" && (
                <>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Status</span>
                    <Badge variant="secondary">Awaiting Settlement</Badge>
                  </div>
                </>
              )}
            </div>
          </Card>

          {bet.settledAt && (
            <Card className="p-4 bg-muted">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-xs space-y-1">
                  <p>
                    <span className="font-semibold">Settled:</span> {format(new Date(bet.settledAt), "PPpp")}
                  </p>
                  <p>
                    <span className="font-semibold">Settlement Type:</span>{" "}
                    {bet.settledBy === "auto" ? "Automatic" : "Manual"}
                  </p>
                  {bet.taxDetails && (
                    <p className="mt-2 text-muted-foreground">
                      All deductions were automatically calculated and applied according to the jurisdiction rules in effect
                      at the time of settlement. This receipt serves as proof of transaction.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            {navigator.share && (
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
