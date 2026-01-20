"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, Clock, AlertCircle, Camera, FileText, ChevronRight, Check } from "lucide-react"
import Link from "next/link"

export default function KYCVerificationPage() {
  const [kycStatus, setKycStatus] = useState("pending")
  const [documents, setDocuments] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
  })

  const [uploadedDocs, setUploadedDocs] = useState({
    idFront: false,
    idBack: false,
    selfie: false,
  })

  const handleFileUpload = (docType, file) => {
    if (file) {
      setDocuments({ ...documents, [docType]: file })
      setUploadedDocs({ ...uploadedDocs, [docType]: true })
    }
  }

  const handleSubmitKYC = () => {
    if (uploadedDocs.idFront && uploadedDocs.idBack && uploadedDocs.selfie) {
      setKycStatus("under-review")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1A2F] via-[#0D1F35] to-[#0A1A2F] text-[#F5F5F5] p-4 md:p-6 pt-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="text-[#B8C5D6] hover:text-[#FFD700] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-[#B8C5D6]" />
          <span className="text-[#FFD700]">KYC Verification</span>
        </div>

        {/* Status Card */}
        <Card className="bg-[#0D1F35]/80 border border-[#2A3F55] mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#4A90E2]/20 p-6 border-b border-[#2A3F55]">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Know Your Customer (KYC)</h1>
                  <p className="text-[#B8C5D6]">Complete verification to unlock higher withdrawal limits</p>
                </div>
                <div className="flex items-center gap-3">
                  {kycStatus === "approved" && (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                      <span className="text-green-400 font-bold text-sm">Verified</span>
                    </div>
                  )}
                  {kycStatus === "pending" && (
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-12 w-12 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-sm">Pending</span>
                    </div>
                  )}
                  {kycStatus === "under-review" && (
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-12 w-12 text-blue-400" />
                      <span className="text-blue-400 font-bold text-sm">Reviewing</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#B8C5D6] font-medium">Verification Progress</span>
                  <span className="text-[#FFD700] font-bold">
                    {Math.round((Object.values(uploadedDocs).filter(Boolean).length / 3) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#1A2F45]/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FFD700] to-[#4A90E2] h-full transition-all duration-500"
                    style={{
                      width: `${(Object.values(uploadedDocs).filter(Boolean).length / 3) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Document Upload Sections */}
              <div className="space-y-4">
                {/* ID Front */}
                <DocumentUploadCard
                  title="ID Card Front"
                  description="Clear photo of your ID card front side"
                  icon={FileText}
                  docType="idFront"
                  isUploaded={uploadedDocs.idFront}
                  onUpload={(file) => handleFileUpload("idFront", file)}
                  status={kycStatus}
                />

                {/* ID Back */}
                <DocumentUploadCard
                  title="ID Card Back"
                  description="Clear photo of your ID card back side"
                  icon={FileText}
                  docType="idBack"
                  isUploaded={uploadedDocs.idBack}
                  onUpload={(file) => handleFileUpload("idBack", file)}
                  status={kycStatus}
                />

                {/* Selfie */}
                <DocumentUploadCard
                  title="Selfie with ID"
                  description="Your photo holding the ID card"
                  icon={Camera}
                  docType="selfie"
                  isUploaded={uploadedDocs.selfie}
                  onUpload={(file) => handleFileUpload("selfie", file)}
                  status={kycStatus}
                />
              </div>

              {/* Submit Button */}
              {kycStatus === "pending" && (
                <Button
                  onClick={handleSubmitKYC}
                  disabled={!Object.values(uploadedDocs).every(Boolean)}
                  className="w-full mt-6 bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit for Verification
                </Button>
              )}

              {kycStatus === "under-review" && (
                <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    Your documents are under review. This usually takes 24-48 hours. You'll be notified via email and
                    SMS when your KYC is verified.
                  </p>
                </div>
              )}

              {kycStatus === "approved" && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm">
                    Your KYC verification is complete! You can now access higher withdrawal limits and all premium
                    features.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Limits */}
        <Card className="bg-[#0D1F35]/80 border border-[#2A3F55]">
          <CardHeader>
            <CardTitle className="text-[#FFD700]">Withdrawal Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  status: "Unverified",
                  limit: "$100 / day",
                  current: kycStatus === "pending",
                },
                {
                  status: "Verified",
                  limit: "Unlimited",
                  current: kycStatus === "approved",
                },
              ].map((limit, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    limit.current ? "bg-[#FFD700]/10 border-[#FFD700]" : "bg-[#1A2F45]/50 border-[#2A3F55]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#F5F5F5] font-bold">{limit.status}</p>
                      <p className="text-[#B8C5D6] text-sm">Daily Limit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFD700] text-2xl font-bold">{limit.limit}</p>
                      {limit.current && <Check className="h-5 w-5 text-green-400 mt-1 mx-auto" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DocumentUploadCard({ title, description, icon: Icon, docType, isUploaded, onUpload, status }) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="p-4 bg-[#1A2F45]/50 rounded-lg border border-[#2A3F55]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#FFD700]/20 rounded-lg">
            <Icon className="h-5 w-5 text-[#FFD700]" />
          </div>
          <div>
            <p className="text-[#F5F5F5] font-bold">{title}</p>
            <p className="text-[#B8C5D6] text-sm">{description}</p>
          </div>
        </div>
        {isUploaded && <CheckCircle className="h-5 w-5 text-green-400" />}
      </div>

      {!isUploaded ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive ? "border-[#FFD700] bg-[#FFD700]/10" : "border-[#2A3F55] hover:border-[#FFD700]/50"
          }`}
        >
          <Upload className="h-6 w-6 text-[#B8C5D6] mx-auto mb-2" />
          <p className="text-[#F5F5F5] text-sm font-medium mb-1">Drag and drop your photo here</p>
          <p className="text-[#B8C5D6] text-xs mb-3">or</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUpload(e.target.files?.[0])}
            id={`upload-${docType}`}
            className="hidden"
            disabled={status !== "pending"}
          />
          <Button
            as="label"
            htmlFor={`upload-${docType}`}
            className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold cursor-pointer"
            disabled={status !== "pending"}
          >
            Choose File
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm text-center">Document uploaded successfully</p>
        </div>
      )}
    </div>
  )
}
