"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Smartphone,
  Bitcoin,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Ticket,
  Gift,
  Copy,
  Info,
} from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { CURRENCIES } from "@/lib/currency-config"
import { getAuthToken } from "@/lib/auth-service"

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, fee: "2.5%", instant: true },
  { id: "mobile", name: "Mobile Money", icon: Smartphone, fee: "1.5%", instant: true },
  { id: "airtime", name: "Airtime", icon: Smartphone, fee: "0%", instant: true },
  { id: "crypto", name: "Cryptocurrency", icon: Bitcoin, fee: "1.0%", instant: false },
  { id: "bank", name: "Bank Transfer", icon: DollarSign, fee: "0.5%", instant: false },
]

export default function TopUpWithdraw() {
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false)

  const [voucherCode, setVoucherCode] = useState("")
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState("")
  const [voucherSuccess, setVoucherSuccess] = useState("")
  const [validatedVoucher, setValidatedVoucher] = useState(null)

  const { wallet, transactions, isLoading, error, deposit, withdraw, refreshWallet } = useWallet()

  const getPaymentMethodLabel = (tx) => {
    if (typeof tx.method === "string") return tx.method
    if (tx.method?.type) return tx.method.type
    if (typeof tx.paymentMethod === "string") return tx.paymentMethod
    if (tx.paymentMethod?.type) return tx.paymentMethod.type
    return "Unknown"
  }

  const handleDeposit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsProcessing(true)
    setPaymentDetails(null)
    setShowPaymentInstructions(false)

    try {
      const token = getAuthToken()
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          paymentMethod: selectedMethod,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (data.requiresApproval) {
          // Show payment instructions for bank/crypto
          setPaymentDetails(data.data)
          setShowPaymentInstructions(true)
        } else {
          // Instant deposit successful
          setAmount("")
          await refreshWallet()
          alert(`Successfully deposited ${currencySymbol}${amount}`)
        }
      } else {
        alert(`Deposit failed: ${data.error}`)
      }
    } catch (err) {
      alert(`Deposit failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const handleWithdraw = async () => {
    const withdrawAmount = Number.parseFloat(amount)
    if (!amount || withdrawAmount <= 0) return
    if (wallet && withdrawAmount > wallet.balance) {
      alert("Insufficient balance")
      return
    }

    setIsProcessing(true)
    try {
      await withdraw(withdrawAmount, selectedMethod)
      setAmount("")
      alert(`Withdrawal of ${currencySymbol}${amount} is being processed`)
    } catch (err) {
      alert(`Withdrawal failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return

    setVoucherLoading(true)
    setVoucherError("")
    setValidatedVoucher(null)

    try {
      const token = getAuthToken()
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (data.success) {
        setValidatedVoucher(data.data)
      } else {
        setVoucherError(data.error || "Invalid voucher code")
      }
    } catch (err) {
      setVoucherError("Failed to validate voucher")
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleRedeemVoucher = async () => {
    if (!validatedVoucher) return

    setVoucherLoading(true)
    setVoucherError("")

    try {
      const token = getAuthToken()
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (data.success) {
        setVoucherSuccess(
          `Successfully redeemed ${currencySymbol}${data.data.amount}! Your new balance is ${currencySymbol}${data.data.newBalance.toFixed(2)}`,
        )
        setVoucherCode("")
        setValidatedVoucher(null)
        await refreshWallet()
        setTimeout(() => setVoucherSuccess(""), 5000)
      } else {
        setVoucherError(data.error || "Failed to redeem voucher")
      }
    } catch (err) {
      setVoucherError("Failed to redeem voucher")
    } finally {
      setVoucherLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
        <span className="ml-2 text-[#B8C5D6]">Loading wallet...</span>
      </div>
    )
  }

  const balance = wallet?.balance || 0
  const bonusBalance = wallet?.bonus || 0
  const walletCurrency = wallet?.currency || "USD"
  const currencySymbol = CURRENCIES[walletCurrency]?.symbol || "$"
  const selectedMethodInfo = paymentMethods.find((m) => m.id === selectedMethod)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-[#1A2F45] to-[#0D1F35] border-[#2A3F55]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#FFD700]">Your Balance</CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshWallet} className="text-[#B8C5D6] hover:text-[#FFD700]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {currencySymbol}
              {balance.toLocaleString()}
            </span>
          </div>
          {bonusBalance > 0 && (
            <div className="mt-2 text-sm text-[#B8C5D6]">
              Bonus Balance:{" "}
              <span className="text-[#FFD700]">
                {currencySymbol}
                {bonusBalance.toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1A2F45]">
          <TabsTrigger value="deposit" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="redeem" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Ticket className="h-4 w-4 mr-2" />
            Redeem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="bg-[#1A2F45] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Deposit Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPaymentInstructions && paymentDetails && (
                <div className="p-4 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 space-y-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-[#FFD700] mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white">Payment Instructions</h4>
                      <p className="text-sm text-[#B8C5D6]">{paymentDetails.instructions}</p>
                    </div>
                  </div>

                  <div className="bg-[#0D1F35] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#B8C5D6]">Amount to send:</span>
                      <span className="text-xl font-bold text-[#FFD700]">
                        {currencySymbol}
                        {paymentDetails.amount}
                      </span>
                    </div>

                    {paymentDetails.paymentMethod === "bank" && paymentDetails.paymentDetails && (
                      <>
                        <div className="border-t border-[#2A3F55] pt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[#B8C5D6] text-sm">Bank Name:</span>
                            <span className="text-white">{paymentDetails.paymentDetails.bankName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#B8C5D6] text-sm">Account Name:</span>
                            <span className="text-white">{paymentDetails.paymentDetails.accountName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#B8C5D6] text-sm">Account Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono">
                                {paymentDetails.paymentDetails.accountNumber}
                              </span>
                              <button
                                onClick={() => copyToClipboard(paymentDetails.paymentDetails.accountNumber)}
                                className="text-[#FFD700] hover:text-[#FFD700]/80"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {paymentDetails.paymentDetails.routingNumber && (
                            <div className="flex justify-between items-center">
                              <span className="text-[#B8C5D6] text-sm">Routing Number:</span>
                              <span className="text-white font-mono">
                                {paymentDetails.paymentDetails.routingNumber}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center bg-[#FFD700]/10 p-2 rounded">
                            <span className="text-[#B8C5D6] text-sm">Reference (IMPORTANT):</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#FFD700] font-mono font-bold">
                                {paymentDetails.paymentDetails.reference}
                              </span>
                              <button
                                onClick={() => copyToClipboard(paymentDetails.paymentDetails.reference)}
                                className="text-[#FFD700] hover:text-[#FFD700]/80"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {paymentDetails.paymentMethod === "crypto" && paymentDetails.paymentDetails && (
                      <>
                        <div className="border-t border-[#2A3F55] pt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[#B8C5D6] text-sm">Network:</span>
                            <span className="text-white">{paymentDetails.paymentDetails.network}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[#B8C5D6] text-sm">Wallet Address:</span>
                            <div className="flex items-center gap-2 bg-[#0A1A2F] p-2 rounded">
                              <span className="text-white font-mono text-xs break-all">
                                {paymentDetails.paymentDetails.walletAddress}
                              </span>
                              <button
                                onClick={() => copyToClipboard(paymentDetails.paymentDetails.walletAddress)}
                                className="text-[#FFD700] hover:text-[#FFD700]/80 flex-shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {paymentDetails.paymentDetails.memo && (
                            <div className="flex justify-between items-center bg-[#FFD700]/10 p-2 rounded">
                              <span className="text-[#B8C5D6] text-sm">Memo (IMPORTANT):</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#FFD700] font-mono">{paymentDetails.paymentDetails.memo}</span>
                                <button
                                  onClick={() => copyToClipboard(paymentDetails.paymentDetails.memo)}
                                  className="text-[#FFD700] hover:text-[#FFD700]/80"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-yellow-500 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Your deposit is pending. Funds will be credited after verification.</span>
                  </div>

                  <Button
                    onClick={() => {
                      setShowPaymentInstructions(false)
                      setPaymentDetails(null)
                      setAmount("")
                      refreshWallet()
                    }}
                    variant="outline"
                    className="w-full border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
                  >
                    Done - I've Made the Transfer
                  </Button>
                </div>
              )}

              {/* Payment Methods - hide when showing instructions */}
              {!showPaymentInstructions && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-lg border transition-all ${
                          selectedMethod === method.id
                            ? "border-[#FFD700] bg-[#FFD700]/10"
                            : "border-[#2A3F55] hover:border-[#FFD700]/50"
                        }`}
                      >
                        <method.icon
                          className={`h-6 w-6 mx-auto mb-2 ${selectedMethod === method.id ? "text-[#FFD700]" : "text-[#B8C5D6]"}`}
                        />
                        <p
                          className={`text-sm font-medium ${selectedMethod === method.id ? "text-[#FFD700]" : "text-white"}`}
                        >
                          {method.name}
                        </p>
                        <p className="text-xs text-[#B8C5D6]">Fee: {method.fee}</p>
                      </button>
                    ))}
                  </div>

                  {selectedMethodInfo && !selectedMethodInfo.instant && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                      <p className="text-sm text-blue-300">
                        {selectedMethod === "bank"
                          ? "Bank transfers require manual verification. You'll receive payment details after clicking deposit."
                          : "Crypto deposits require blockchain confirmation. You'll receive the wallet address after clicking deposit."}
                      </p>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#B8C5D6]">Amount ({walletCurrency})</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-[#0D1F35] border-[#2A3F55] text-white"
                    />
                  </div>

                  {/* Quick Amounts */}
                  <div className="flex gap-2 flex-wrap">
                    {[50, 100, 250, 500, 1000].map((value) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(value.toString())}
                        className="border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700] hover:text-[#FFD700]"
                      >
                        {currencySymbol}
                        {value}
                      </Button>
                    ))}
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isProcessing || !amount}
                    className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="h-4 w-4 mr-2" />
                        {selectedMethodInfo?.instant ? "Deposit" : "Get Payment Details"} {currencySymbol}
                        {amount || "0"}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card className="bg-[#1A2F45] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white">Withdraw Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Methods */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedMethod === method.id
                        ? "border-[#FFD700] bg-[#FFD700]/10"
                        : "border-[#2A3F55] hover:border-[#FFD700]/50"
                    }`}
                  >
                    <method.icon
                      className={`h-6 w-6 mx-auto mb-2 ${selectedMethod === method.id ? "text-[#FFD700]" : "text-[#B8C5D6]"}`}
                    />
                    <p
                      className={`text-sm font-medium ${selectedMethod === method.id ? "text-[#FFD700]" : "text-white"}`}
                    >
                      {method.name}
                    </p>
                    <p className="text-xs text-[#B8C5D6]">Fee: {method.fee}</p>
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm text-[#B8C5D6]">Amount ({walletCurrency})</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#0D1F35] border-[#2A3F55] text-white"
                />
                <p className="text-xs text-[#B8C5D6]">
                  Available: {currencySymbol}
                  {balance.toLocaleString()}
                </p>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 250, 500].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(value.toString())}
                    disabled={value > balance}
                    className="border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700] hover:text-[#FFD700] disabled:opacity-50"
                  >
                    {currencySymbol}
                    {value}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(balance.toString())}
                  className="border-[#2A3F55] text-[#B8C5D6] hover:border-[#FFD700] hover:text-[#FFD700]"
                >
                  Max
                </Button>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={isProcessing || !amount || Number.parseFloat(amount) > balance}
                className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw {currencySymbol}
                    {amount || "0"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem">
          <Card className="bg-[#1A2F45] border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#FFD700]" />
                Redeem Voucher
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Message */}
              {voucherSuccess && (
                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  {voucherSuccess}
                </div>
              )}

              {/* Error Message */}
              {voucherError && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                  <XCircle className="h-4 w-4 inline mr-2" />
                  {voucherError}
                </div>
              )}

              {/* Voucher Code Input */}
              <div className="space-y-2">
                <label className="text-sm text-[#B8C5D6]">Enter Voucher Code</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., VCH-XXXX-XXXX"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase())
                      setVoucherError("")
                      setValidatedVoucher(null)
                    }}
                    className="bg-[#0D1F35] border-[#2A3F55] text-white font-mono uppercase"
                  />
                  <Button
                    onClick={handleValidateVoucher}
                    disabled={voucherLoading || !voucherCode.trim()}
                    variant="outline"
                    className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent"
                  >
                    {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                  </Button>
                </div>
                <p className="text-xs text-[#B8C5D6]">Enter the voucher code provided by your agent</p>
              </div>

              {/* Validated Voucher Details */}
              {validatedVoucher && (
                <div className="p-4 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[#B8C5D6]">Voucher Amount:</span>
                    <span className="text-2xl font-bold text-[#FFD700]">
                      {currencySymbol}
                      {validatedVoucher.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#B8C5D6]">Expires:</span>
                    <span className="text-white">{new Date(validatedVoucher.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-[#B8C5D6]">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Valid</Badge>
                  </div>
                </div>
              )}

              {/* Redeem Button */}
              <Button
                onClick={handleRedeemVoucher}
                disabled={voucherLoading || !validatedVoucher}
                className="w-full bg-[#FFD700] text-[#0A1A2F] hover:bg-[#FFD700]/90"
              >
                {voucherLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="h-4 w-4 mr-2" />
                    Redeem Voucher
                    {validatedVoucher && ` - ${currencySymbol}${validatedVoucher.amount}`}
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-[#0D1F35] border border-[#2A3F55]">
                <h4 className="text-sm font-medium text-white mb-2">How to redeem:</h4>
                <ol className="text-xs text-[#B8C5D6] space-y-1 list-decimal list-inside">
                  <li>Enter your voucher code in the field above</li>
                  <li>Click "Validate" to verify the voucher</li>
                  <li>Review the voucher details</li>
                  <li>Click "Redeem Voucher" to add funds to your wallet</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <Card className="bg-[#1A2F45] border-[#2A3F55]">
        <CardHeader>
          <CardTitle className="text-white">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx, index) => (
                <div key={tx._id || index} className="flex items-center justify-between p-3 bg-[#0D1F35] rounded-lg">
                  <div className="flex items-center gap-3">
                    {tx.type === "deposit" ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-500" />
                    ) : tx.type === "withdrawal" ? (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    ) : tx.type === "voucher_redemption" ? (
                      <Ticket className="h-5 w-5 text-[#FFD700]" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-[#B8C5D6]" />
                    )}
                    <div>
                      <p className="text-white font-medium capitalize">
                        {tx.type === "voucher_redemption" ? "Voucher Redemption" : tx.type}
                      </p>
                      <p className="text-xs text-[#B8C5D6]">
                        {getPaymentMethodLabel(tx)} • {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.type === "deposit" || tx.type === "voucher_redemption" ? "text-green-500" : "text-red-500"}`}
                    >
                      {tx.type === "deposit" || tx.type === "voucher_redemption" ? "+" : "-"}
                      {currencySymbol}
                      {tx.amount}
                    </p>
                    <Badge variant="outline" className={getStatusColor(tx.status)}>
                      {getStatusIcon(tx.status)}
                      <span className="ml-1 capitalize">{tx.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#B8C5D6] py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
