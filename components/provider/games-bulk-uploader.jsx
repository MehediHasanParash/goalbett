"use client"

import { useState } from "react"
import { Upload, AlertCircle, Check } from "lucide-react"

export default function GamesBulkUploader({ onUploadComplete }) {
  const [csvContent, setCsvContent] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResults, setValidationResults] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const csvTemplate = `title,provider,category,rtp,volatility,tags,launchUrl
Example Game 1,Pragmatic Play,Slots,96.5,High,popular;new,https://example.com/game1
Example Game 2,NetEnt,Table Games,97.2,Medium,classic;favorite,https://example.com/game2`

  const validateRow = (row, idx) => {
    const [title, provider, category, rtp, volatility] = row.split(",").map((v) => v.trim())
    const errors = []

    if (!title) errors.push("Missing title")
    if (!provider) errors.push("Missing provider")
    if (!category) errors.push("Missing category")
    if (isNaN(rtp) || rtp < 0 || rtp > 100) errors.push("Invalid RTP")
    if (!["Low", "Medium", "High"].includes(volatility)) errors.push("Invalid volatility")

    return {
      rowNumber: idx + 1,
      status: errors.length === 0 ? "valid" : "invalid",
      errors,
      data: { title, provider, category, rtp: Number.parseFloat(rtp), volatility },
    }
  }

  const handleParse = () => {
    const rows = csvContent.trim().split("\n")
    if (rows.length < 2) {
      alert("CSV must contain at least a header and one data row")
      return
    }

    const results = rows.slice(1).map((row, idx) => validateRow(row, idx))
    setValidationResults(results)
  }

  const handleUpload = async () => {
    setIsUploading(true)

    // Simulate upload with progress
    const validGames = validationResults.filter((r) => r.status === "valid")

    for (let i = 0; i < validGames.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setUploadProgress(Math.round(((i + 1) / validGames.length) * 100))
    }

    setIsUploading(false)
    onUploadComplete(validGames.length)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-semibold text-foreground mb-2">Bulk Upload Instructions</p>
        <p className="text-xs text-muted-foreground mb-3">
          Upload multiple games at once using CSV format. Download the template to get started.
        </p>
        <button
          onClick={() => {
            const element = document.createElement("a")
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csvTemplate))
            element.setAttribute("download", "games_template.csv")
            element.style.display = "none"
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
          }}
          className="text-sm text-secondary hover:text-secondary/80 font-semibold"
        >
          Download CSV Template
        </button>
      </div>

      {/* CSV Input */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">CSV Content</label>
        <textarea
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder={csvTemplate}
          rows={6}
          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary font-mono text-xs"
        />
      </div>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="font-semibold text-foreground mb-3">Validation Results</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {validationResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.status === "valid"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-destructive/10 border-destructive/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Row {result.rowNumber}</p>
                    {result.status === "invalid" && (
                      <ul className="text-xs text-destructive mt-1 list-disc list-inside">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Uploading...</p>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% complete</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleParse}
          disabled={!csvContent || isUploading}
          className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Validate CSV
        </button>
        <button
          onClick={handleUpload}
          disabled={validationResults.length === 0 || isUploading}
          className="flex-1 px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
        >
          <Upload size={18} />
          Upload Games
        </button>
      </div>
    </div>
  )
}
