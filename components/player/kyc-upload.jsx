"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, XCircle, Clock, Eye, X } from "lucide-react"

export function KYCUpload() {
  const [uploading, setUploading] = useState({
    identity: false,
    address: false,
    selfie: false,
  })
  const [kycStatus, setKycStatus] = useState({
    identity: { status: "not_uploaded", url: null },
    address: { status: "not_uploaded", url: null },
    selfie: { status: "not_uploaded", url: null },
  })
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState({
    identity: null,
    address: null,
    selfie: null,
  })

  const identityRef = useRef(null)
  const addressRef = useRef(null)
  const selfieRef = useRef(null)

  useEffect(() => {
    fetchKYCStatus()
  }, [])

  const fetchKYCStatus = async () => {
    try {
      const response = await fetch("/api/player/kyc/status")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Fetched KYC status:", data)
        if (data.kyc) {
          setKycStatus({
            identity: {
              status: data.kyc.documents?.identity?.status || "not_uploaded",
              url: data.kyc.documents?.identity?.url || null,
              fileName: data.kyc.documents?.identity?.fileName || null,
            },
            address: {
              status: data.kyc.documents?.proofOfAddress?.status || "not_uploaded",
              url: data.kyc.documents?.proofOfAddress?.url || null,
              fileName: data.kyc.documents?.proofOfAddress?.fileName || null,
            },
            selfie: {
              status: data.kyc.documents?.selfie?.status || "not_uploaded",
              url: data.kyc.documents?.selfie?.url || null,
              fileName: data.kyc.documents?.selfie?.fileName || null,
            },
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching KYC status:", error)
    }
  }

  const handleFileSelect = (type, file) => {
    if (!file) return
    setSelectedFiles({ ...selectedFiles, [type]: file })
  }

  const handleFileUpload = async (type) => {
    const file = selectedFiles[type]
    if (!file) return

    setUploading({ ...uploading, [type]: true })

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = async () => {
        const base64 = reader.result
        console.log("[v0] Uploading document type:", type, "file:", file.name)

        const response = await fetch("/api/player/kyc/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType: type,
            fileData: base64,
            fileName: file.name,
          }),
        })

        const data = await response.json()
        console.log("[v0] Upload response:", data)

        if (!response.ok) {
          throw new Error(data.error || "Upload failed")
        }

        // Update local state with the returned URL
        setKycStatus({
          ...kycStatus,
          [type]: { status: "pending", url: data.url, fileName: file.name },
        })

        // Clear selected file
        setSelectedFiles({ ...selectedFiles, [type]: null })

        // Reset file input
        if (type === "identity" && identityRef.current) identityRef.current.value = ""
        if (type === "address" && addressRef.current) addressRef.current.value = ""
        if (type === "selfie" && selfieRef.current) selfieRef.current.value = ""

        alert("Document uploaded successfully! Awaiting verification.")
      }

      reader.onerror = () => {
        throw new Error("Failed to read file")
      }
    } catch (error) {
      console.error("[v0] Error uploading KYC document:", error)
      alert(`Failed to upload document: ${error.message}`)
    } finally {
      setUploading({ ...uploading, [type]: false })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Upload className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "verified":
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      case "pending":
        return "Pending Review"
      default:
        return "Not Uploaded"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
      case "approved":
        return "text-green-500"
      case "rejected":
        return "text-red-500"
      case "pending":
        return "text-yellow-500"
      default:
        return "text-gray-400"
    }
  }

  const DocumentSection = ({ type, title, description, inputRef }) => {
    const status = kycStatus[type]
    const isUploading = uploading[type]
    const selectedFile = selectedFiles[type]
    const isVerified = status.status === "verified" || status.status === "approved"

    return (
      <div className="border-b border-gray-700 pb-6 last:border-b-0 last:pb-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <div className={`flex items-center gap-2 ${getStatusColor(status.status)}`}>
            {getStatusIcon(status.status)}
            <span className="text-sm font-medium">{getStatusText(status.status)}</span>
          </div>
        </div>

        {/* Show uploaded document preview */}
        {status.url && (
          <div className="mb-4 p-3 bg-[#1a2942] rounded-lg border border-[#2a3f55]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={status.url || "/placeholder.svg"}
                  alt={title}
                  className="w-16 h-16 object-cover rounded-lg border border-[#2a3f55]"
                />
                <div>
                  <p className="text-sm text-white font-medium">{status.fileName || "Document"}</p>
                  <p className="text-xs text-gray-400">Uploaded successfully</p>
                </div>
              </div>
              <Button
                onClick={() => setPreviewImage({ title, url: status.url })}
                size="sm"
                className="bg-[#FFD700]/20 hover:bg-[#FFD700]/30 text-[#FFD700]"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        )}

        {/* File input and upload button */}
        {!isVerified && (
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileSelect(type, e.target.files[0])}
              disabled={isUploading}
              className="block w-full text-sm text-gray-300 
                file:mr-4 file:py-2 file:px-4 
                file:rounded-lg file:border-0 
                file:text-sm file:font-semibold 
                file:bg-[#FFD700] file:text-[#0a1929] 
                hover:file:bg-[#FFC700] 
                disabled:opacity-50 cursor-pointer"
            />

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-[#1a2942] rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedFiles({ ...selectedFiles, [type]: null })
                      if (inputRef.current) inputRef.current.value = ""
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleFileUpload(type)}
                    disabled={isUploading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="flex items-center gap-2 text-[#FFD700]">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#FFD700]"></div>
                <span className="text-sm">Uploading to cloud storage...</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#0d1929] border-[#2a3f55]">
        <CardHeader>
          <CardTitle className="text-white">KYC Verification</CardTitle>
          <CardDescription className="text-gray-400">
            Upload your documents to verify your identity and comply with regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DocumentSection
            type="identity"
            title="Identity Document"
            description="Upload your passport, national ID, or driver's license"
            inputRef={identityRef}
          />

          <DocumentSection
            type="address"
            title="Proof of Address"
            description="Upload a utility bill, bank statement, or rental agreement (not older than 3 months)"
            inputRef={addressRef}
          />

          <DocumentSection
            type="selfie"
            title="Selfie with ID"
            description="Upload a selfie holding your identity document next to your face"
            inputRef={selfieRef}
          />
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] w-full">
            <div className="bg-[#0D1F35] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#FFD700]">{previewImage.title}</h3>
                <Button
                  onClick={() => setPreviewImage(null)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  Close
                </Button>
              </div>
            </div>
            <img
              src={previewImage.url || "/placeholder.svg"}
              alt={previewImage.title}
              className="max-w-full max-h-[80vh] mx-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default KYCUpload
