"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Upload, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AgentRegistration() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    businessName: "",
    businessLocation: "",
    bankAccount: "",
    bankName: "",
    referralCode: "",
  })
  const [idDocument, setIdDocument] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center p-3 sm:p-4 md:p-6">
        <Card className="max-w-md w-full bg-white/95 border-[#FFD700]">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A1A2F]">Application Submitted!</h2>
            <p className="text-sm sm:text-base text-gray-600">
              Your agent registration has been submitted for review. You will receive an email notification once your
              application is approved by our admin team.
            </p>
            <div className="bg-[#FFD700]/10 border border-[#FFD700] rounded-lg p-4">
              <p className="text-sm text-[#0A1A2F] font-medium break-all">
                Application ID: AG-{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p className="text-xs text-gray-600 mt-1">Please save this ID for reference</p>
            </div>
            <Link href="/auth" className="block">
              <Button className="w-full bg-[#0A1A2F] hover:bg-[#0A1A2F]/90 text-white">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A1A2F] py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFD700] mb-2">Become an Agent</h1>
          <p className="text-sm sm:text-base text-[#F5F5F5]">Join our network and start earning commissions today</p>
        </div>

        <Card className="bg-white/95 border-[#FFD700]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A1A2F] text-lg sm:text-xl">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700]" />
              Agent Registration Form
            </CardTitle>
            <CardDescription className="text-sm">
              Fill in your details to apply as an agent. All applications are reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#0A1A2F] border-b border-[#FFD700] pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-sm">
                      ID/Passport Number *
                    </Label>
                    <Input
                      id="idNumber"
                      required
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">
                    Physical Address *
                  </Label>
                  <Textarea
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="border-gray-300 focus:border-[#FFD700] text-sm min-h-[80px]"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#0A1A2F] border-b border-[#FFD700] pb-2">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm">
                      Business Name (Optional)
                    </Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessLocation" className="text-sm">
                      Business Location *
                    </Label>
                    <Input
                      id="businessLocation"
                      required
                      value={formData.businessLocation}
                      onChange={(e) => setFormData({ ...formData, businessLocation: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#0A1A2F] border-b border-[#FFD700] pb-2">
                  Banking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-sm">
                      Bank Name *
                    </Label>
                    <Input
                      id="bankName"
                      required
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount" className="text-sm">
                      Account Number *
                    </Label>
                    <Input
                      id="bankAccount"
                      required
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="border-gray-300 focus:border-[#FFD700] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#0A1A2F] border-b border-[#FFD700] pb-2">
                  Document Upload
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="idDocument" className="text-sm">
                    ID/Passport Copy *
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-[#FFD700] transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                    <Input
                      id="idDocument"
                      type="file"
                      accept="image/*,.pdf"
                      required
                      onChange={(e) => setIdDocument(e.target.files[0])}
                      className="hidden"
                    />
                    <Label htmlFor="idDocument" className="cursor-pointer">
                      <span className="text-[#FFD700] hover:underline text-sm">Click to upload</span>
                      <span className="text-gray-500 text-sm"> or drag and drop</span>
                    </Label>
                    {idDocument && (
                      <p className="text-xs sm:text-sm text-green-600 mt-2 break-all">✓ {idDocument.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-sm">
                  Referral Code (Optional)
                </Label>
                <Input
                  id="referralCode"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  placeholder="Enter referral code if you have one"
                  className="border-gray-300 focus:border-[#FFD700] text-sm"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="bg-[#FFD700]/10 border border-[#FFD700] rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm text-[#0A1A2F]">
                    <p className="font-semibold mb-1">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>All applications are subject to admin approval</li>
                      <li>You will be notified via email once approved</li>
                      <li>Commission rate: 10% on all sales</li>
                      <li>Minimum withdrawal: $50</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold text-sm sm:text-base"
                >
                  Submit Application
                </Button>
                <Link href="/auth" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#0A1A2F] text-[#0A1A2F] bg-transparent text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
