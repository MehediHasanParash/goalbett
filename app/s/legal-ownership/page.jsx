"use client"

import { useState, useEffect, useRef } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Building2,
  FileText,
  Shield,
  Download,
  Eye,
  Plus,
  CheckCircle,
  Clock,
  Users,
  Briefcase,
  FileSignature,
  Network,
  AlertCircle,
  Trash2,
  HelpCircle,
  Pencil,
} from "lucide-react"
import { getAuthToken } from "@/lib/auth-service"

export default function LegalOwnershipPage() {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState([])
  const [agreements, setAgreements] = useState([])
  const [tenants, setTenants] = useState([])
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [showAgreementDialog, setShowAgreementDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [exportLoading, setExportLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const printRef = useRef(null)

  // Form states
  const [entityForm, setEntityForm] = useState({
    tenantId: "",
    legalName: "",
    registrationNumber: "",
    entityType: "corporation",
    incorporationDate: "",
    jurisdiction: { country: "", state: "", city: "" },
    registeredAddress: { street: "", city: "", state: "", postalCode: "", country: "" },
    contact: { primaryEmail: "", phone: "", website: "" },
    beneficialOwners: [{ name: "", nationality: "", ownershipPercentage: 0, isPoliticallyExposed: false }],
    directors: [{ name: "", position: "", nationality: "" }],
    softwareOwnership: {
      ownershipType: "owned",
      declaration: "",
      declaredBy: "",
    },
  })

  const [agreementForm, setAgreementForm] = useState({
    tenantId: "",
    legalEntityId: "",
    agreementType: "platform_license",
    title: "",
    description: "",
    effectiveDate: "",
    expiryDate: "",
    financialTerms: {
      revenueSharePercentage: 10,
      currency: "USD",
      paymentFrequency: "monthly",
    },
    responsibilities: {
      payments: "tenant",
      aml_kyc: "tenant",
      customer_support: "tenant",
      risk_management: "shared",
      compliance_reporting: "shared",
      technical_support: "platform",
      data_protection: "shared",
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = getAuthToken()

      const [entitiesRes, agreementsRes, tenantsRes] = await Promise.all([
        fetch("/api/super/legal-entities", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/super/tenant-agreements", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/super/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [entitiesData, agreementsData, tenantsData] = await Promise.all([
        entitiesRes.json(),
        agreementsRes.json(),
        tenantsRes.json(),
      ])

      if (entitiesData.success) setEntities(entitiesData.entities || [])
      if (agreementsData.success) setAgreements(agreementsData.agreements || [])

      // Tenants API returns { tenants: [...] } directly, not { success: true, tenants: [...] }
      if (tenantsData.tenants) {
        console.log(
          "[v0] Tenants loaded:",
          tenantsData.tenants.length,
          tenantsData.tenants.map((t) => ({ id: t.id, name: t.name })),
        )
        setTenants(tenantsData.tenants)
      } else {
        console.log("[v0] No tenants in response:", tenantsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEntity = (entity) => {
    console.log("[v0] Editing entity:", entity)
    setEditMode(true)
    setEditingId(entity._id)
    setEntityForm({
      tenantId: entity.tenantId?._id || entity.tenantId || "",
      legalName: entity.legalName || "",
      registrationNumber: entity.registrationNumber || "",
      entityType: entity.entityType || "corporation",
      incorporationDate: entity.incorporationDate ? entity.incorporationDate.split("T")[0] : "",
      jurisdiction: entity.jurisdiction || { country: "", state: "", city: "" },
      registeredAddress: entity.registeredAddress || { street: "", city: "", state: "", postalCode: "", country: "" },
      contact: entity.contact || { primaryEmail: "", phone: "", website: "" },
      beneficialOwners: entity.beneficialOwners || [
        { name: "", nationality: "", ownershipPercentage: 0, isPoliticallyExposed: false },
      ],
      directors: entity.directors || [{ name: "", position: "", nationality: "" }],
      softwareOwnership: entity.softwareOwnership || {
        ownershipType: "owned",
        declaration: "",
        declaredBy: "",
      },
    })
    setShowEntityDialog(true)
  }

  const handleEditAgreement = (agreement) => {
    console.log("[v0] Editing agreement:", agreement)
    setEditMode(true)
    setEditingId(agreement._id)
    setAgreementForm({
      tenantId: agreement.tenantId?._id || agreement.tenantId || "",
      legalEntityId: agreement.legalEntityId?._id || agreement.legalEntityId || "",
      agreementType: agreement.agreementType || "platform_license",
      title: agreement.title || "",
      description: agreement.description || "",
      effectiveDate: agreement.effectiveDate ? agreement.effectiveDate.split("T")[0] : "",
      expiryDate: agreement.expiryDate ? agreement.expiryDate.split("T")[0] : "",
      financialTerms: agreement.financialTerms || {
        revenueSharePercentage: 10,
        currency: "USD",
        paymentFrequency: "monthly",
      },
      responsibilities: agreement.responsibilities || {
        payments: "tenant",
        aml_kyc: "tenant",
        customer_support: "tenant",
        risk_management: "shared",
        compliance_reporting: "shared",
        technical_support: "platform",
        data_protection: "shared",
      },
    })
    setShowAgreementDialog(true)
  }

  const handleCreateEntity = async () => {
    try {
      const token = getAuthToken()
      const method = editMode ? "PUT" : "POST"
      const url = editMode ? `/api/super/legal-entities/${editingId}` : "/api/super/legal-entities"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entityForm),
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
        setShowEntityDialog(false)
        resetEntityForm()
        setEditMode(false)
        setEditingId(null)
      } else {
        alert("Error: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Error saving entity:", error)
    }
  }

  const handleCreateAgreement = async () => {
    try {
      const token = getAuthToken()
      const method = editMode ? "PUT" : "POST"
      const url = editMode ? `/api/super/tenant-agreements/${editingId}` : "/api/super/tenant-agreements"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agreementForm),
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
        setShowAgreementDialog(false)
        resetAgreementForm()
        setEditMode(false)
        setEditingId(null)
      } else {
        alert("Error: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Error saving agreement:", error)
    }
  }

  const resetEntityForm = () => {
    setEntityForm({
      tenantId: "",
      legalName: "",
      registrationNumber: "",
      entityType: "corporation",
      incorporationDate: "",
      jurisdiction: { country: "", state: "", city: "" },
      registeredAddress: { street: "", city: "", state: "", postalCode: "", country: "" },
      contact: { primaryEmail: "", phone: "", website: "" },
      beneficialOwners: [{ name: "", nationality: "", ownershipPercentage: 0, isPoliticallyExposed: false }],
      directors: [{ name: "", position: "", nationality: "" }],
      softwareOwnership: {
        ownershipType: "owned",
        declaration: "",
        declaredBy: "",
      },
    })
    setEditMode(false)
    setEditingId(null)
  }

  const resetAgreementForm = () => {
    setAgreementForm({
      tenantId: "",
      legalEntityId: "",
      agreementType: "platform_license",
      title: "",
      description: "",
      effectiveDate: "",
      expiryDate: "",
      financialTerms: {
        revenueSharePercentage: 10,
        currency: "USD",
        paymentFrequency: "monthly",
      },
      responsibilities: {
        payments: "tenant",
        aml_kyc: "tenant",
        customer_support: "tenant",
        risk_management: "shared",
        compliance_reporting: "shared",
        technical_support: "platform",
        data_protection: "shared",
      },
    })
    setEditMode(false)
    setEditingId(null)
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      pending_signature: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      expired: "bg-red-500/20 text-red-400 border-red-500/30",
      verified: "bg-green-500/20 text-green-400 border-green-500/30",
      under_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }
    return styles[status] || styles.draft
  }

  const handleExportPDF = async () => {
    setExportLoading(true)
    try {
      // Create printable content
      const printWindow = window.open("", "_blank")
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Legal & Ownership Traceability Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #1a365d; border-bottom: 3px solid #ffd700; padding-bottom: 10px; }
            h2 { color: #2d3748; margin-top: 30px; }
            h3 { color: #4a5568; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f7fafc; font-weight: bold; }
            .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-active { background: #c6f6d5; color: #22543d; }
            .badge-draft { background: #e2e8f0; color: #4a5568; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1a365d; }
            .date { color: #718096; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div class="logo">Legal & Ownership Traceability Report</div>
            <div class="date">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>

          <h1>Platform Ownership Summary</h1>
          
          ${
            entities.length > 0
              ? entities
                  .map(
                    (entity) => `
            <div class="section">
              <h2>${entity.legalName}</h2>
              <table>
                <tr><th>Registration Number</th><td>${entity.registrationNumber}</td></tr>
                <tr><th>Entity Type</th><td>${entity.entityType}</td></tr>
                <tr><th>Jurisdiction</th><td>${entity.jurisdiction?.country || "N/A"}, ${entity.jurisdiction?.state || ""}</td></tr>
                <tr><th>Status</th><td><span class="badge badge-${entity.verificationStatus}">${entity.verificationStatus}</span></td></tr>
                <tr><th>Incorporation Date</th><td>${entity.incorporationDate ? new Date(entity.incorporationDate).toLocaleDateString() : "N/A"}</td></tr>
              </table>

              <h3>Registered Address</h3>
              <p>${entity.registeredAddress?.street || ""}, ${entity.registeredAddress?.city || ""}, ${entity.registeredAddress?.country || ""}</p>

              <h3>Contact Information</h3>
              <table>
                <tr><th>Email</th><td>${entity.contact?.primaryEmail || "N/A"}</td></tr>
                <tr><th>Phone</th><td>${entity.contact?.phone || "N/A"}</td></tr>
                <tr><th>Website</th><td>${entity.contact?.website || "N/A"}</td></tr>
              </table>

              ${
                entity.beneficialOwners?.length > 0
                  ? `
                <h3>Beneficial Owners (UBO)</h3>
                <table>
                  <tr><th>Name</th><th>Nationality</th><th>Ownership %</th><th>PEP Status</th></tr>
                  ${entity.beneficialOwners
                    .map(
                      (owner) => `
                    <tr>
                      <td>${owner.name}</td>
                      <td>${owner.nationality || "N/A"}</td>
                      <td>${owner.ownershipPercentage}%</td>
                      <td>${owner.isPoliticallyExposed ? "Yes" : "No"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </table>
              `
                  : ""
              }

              ${
                entity.directors?.length > 0
                  ? `
                <h3>Directors & Officers</h3>
                <table>
                  <tr><th>Name</th><th>Position</th><th>Nationality</th></tr>
                  ${entity.directors
                    .map(
                      (dir) => `
                    <tr>
                      <td>${dir.name}</td>
                      <td>${dir.position}</td>
                      <td>${dir.nationality || "N/A"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </table>
              `
                  : ""
              }

              ${
                entity.licenses?.length > 0
                  ? `
                <h3>Licenses</h3>
                <table>
                  <tr><th>License Type</th><th>Number</th><th>Issuing Authority</th><th>Expiry</th><th>Status</th></tr>
                  ${entity.licenses
                    .map(
                      (lic) => `
                    <tr>
                      <td>${lic.licenseType}</td>
                      <td>${lic.licenseNumber}</td>
                      <td>${lic.issuingAuthority}</td>
                      <td>${new Date(lic.expiryDate).toLocaleDateString()}</td>
                      <td><span class="badge badge-${lic.status}">${lic.status}</span></td>
                    </tr>
                  `,
                    )
                    .join("")}
                </table>
              `
                  : ""
              }

              ${
                entity.softwareOwnership
                  ? `
                <h3>Software Ownership Declaration</h3>
                <table>
                  <tr><th>Ownership Type</th><td>${entity.softwareOwnership.ownershipType}</td></tr>
                  <tr><th>Provider</th><td>${entity.softwareOwnership.providerName || "Self"}</td></tr>
                  <tr><th>Declaration</th><td>${entity.softwareOwnership.declaration || "N/A"}</td></tr>
                  <tr><th>Declared By</th><td>${entity.softwareOwnership.declaredBy || "N/A"}</td></tr>
                  <tr><th>Declaration Date</th><td>${entity.softwareOwnership.declaredAt ? new Date(entity.softwareOwnership.declaredAt).toLocaleDateString() : "N/A"}</td></tr>
                </table>
              `
                  : ""
              }
            </div>
          `,
                  )
                  .join("")
              : "<p>No legal entities registered.</p>"
          }

          <h1>Tenant Agreements</h1>
          ${
            agreements.length > 0
              ? agreements
                  .map(
                    (agr) => `
            <div class="section">
              <h2>${agr.title}</h2>
              <table>
                <tr><th>Reference Number</th><td>${agr.referenceNumber || "N/A"}</td></tr>
                <tr><th>Agreement Type</th><td>${agr.agreementType}</td></tr>
                <tr><th>Tenant</th><td>${agr.tenantId?.name || "N/A"}</td></tr>
                <tr><th>Legal Entity</th><td>${agr.legalEntityId?.legalName || "N/A"}</td></tr>
                <tr><th>Effective Date</th><td>${new Date(agr.effectiveDate).toLocaleDateString()}</td></tr>
                <tr><th>Expiry Date</th><td>${agr.expiryDate ? new Date(agr.expiryDate).toLocaleDateString() : "N/A"}</td></tr>
                <tr><th>Status</th><td><span class="badge badge-${agr.status}">${agr.status}</span></td></tr>
              </table>

              <h3>Responsibility Matrix</h3>
              <table>
                <tr><th>Area</th><th>Responsible Party</th></tr>
                <tr><td>Payments Processing</td><td>${agr.responsibilities?.payments?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>AML/KYC Compliance</td><td>${agr.responsibilities?.aml_kyc?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>Customer Support</td><td>${agr.responsibilities?.customer_support?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>Risk Management</td><td>${agr.responsibilities?.risk_management?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>Compliance Reporting</td><td>${agr.responsibilities?.compliance_reporting?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>Technical Support</td><td>${agr.responsibilities?.technical_support?.toUpperCase() || "N/A"}</td></tr>
                <tr><td>Data Protection</td><td>${agr.responsibilities?.data_protection?.toUpperCase() || "N/A"}</td></tr>
              </table>
            </div>
          `,
                  )
                  .join("")
              : "<p>No agreements on file.</p>"
          }

          <h1>Responsibility Matrix Summary</h1>
          <p>This matrix shows the clear delineation of responsibilities between the Platform Provider and Tenants:</p>
          <table>
            <tr>
              <th>Responsibility Area</th>
              <th>Platform</th>
              <th>Tenant</th>
              <th>Shared</th>
              <th>Description</th>
            </tr>
            <tr>
              <td><strong>Payment Processing</strong></td>
              <td></td>
              <td>✓</td>
              <td></td>
              <td>Tenant handles all payment processing, deposits, and withdrawals</td>
            </tr>
            <tr>
              <td><strong>AML/KYC Compliance</strong></td>
              <td></td>
              <td>✓</td>
              <td></td>
              <td>Tenant responsible for customer identity verification and AML monitoring</td>
            </tr>
            <tr>
              <td><strong>Customer Support</strong></td>
              <td></td>
              <td>✓</td>
              <td></td>
              <td>Tenant provides direct customer support to end users</td>
            </tr>
            <tr>
              <td><strong>Risk Management</strong></td>
              <td></td>
              <td></td>
              <td>✓</td>
              <td>Platform provides tools, Tenant sets limits and monitors activity</td>
            </tr>
            <tr>
              <td><strong>Compliance Reporting</strong></td>
              <td></td>
              <td></td>
              <td>✓</td>
              <td>Platform generates reports, Tenant submits to regulators</td>
            </tr>
            <tr>
              <td><strong>Technical Support</strong></td>
              <td>✓</td>
              <td></td>
              <td></td>
              <td>Platform maintains all technical infrastructure</td>
            </tr>
            <tr>
              <td><strong>Data Protection</strong></td>
              <td></td>
              <td></td>
              <td>✓</td>
              <td>Platform secures infrastructure, Tenant ensures local compliance</td>
            </tr>
            <tr>
              <td><strong>User Funds Security</strong></td>
              <td></td>
              <td>✓</td>
              <td></td>
              <td>Tenant holds and is responsible for all user deposits</td>
            </tr>
          </table>

          <div class="section" style="margin-top: 50px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <p><strong>Document Certification</strong></p>
            <p>This document is an official export from the Legal & Ownership Traceability System.</p>
            <p>Export Date: ${new Date().toISOString()}</p>
            <p>Document ID: LOT-${Date.now()}</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } catch (error) {
      console.error("[v0] Export error:", error)
    } finally {
      setExportLoading(false)
    }
  }

  const addBeneficialOwner = () => {
    setEntityForm({
      ...entityForm,
      beneficialOwners: [
        ...entityForm.beneficialOwners,
        { name: "", nationality: "", ownershipPercentage: 0, isPoliticallyExposed: false },
      ],
    })
  }

  const addDirector = () => {
    setEntityForm({
      ...entityForm,
      directors: [...entityForm.directors, { name: "", position: "", nationality: "" }],
    })
  }

  const removeBeneficialOwner = (index) => {
    const updated = entityForm.beneficialOwners.filter((_, i) => i !== index)
    setEntityForm({ ...entityForm, beneficialOwners: updated })
  }

  const removeDirector = (index) => {
    const updated = entityForm.directors.filter((_, i) => i !== index)
    setEntityForm({ ...entityForm, directors: updated })
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Legal & Ownership Traceability" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]" />
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout
      title="Legal & Ownership Traceability"
      description="Manage platform ownership, tenant agreements, and regulatory documentation"
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowHelpDialog(true)}
              variant="outline"
              className="border-[#2A3F55] text-[#B8C5D6] hover:bg-[#1A2F45]"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How This Works
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={exportLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Full Report
            </Button>
          </div>
        </div>

        {/* Alert for missing data */}
        {entities.length === 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400">Setup Required</h3>
                <p className="text-[#B8C5D6] text-sm mt-1">
                  No legal entities registered. Run the seed script or add your platform legal entity manually to get
                  started.
                </p>
                <code className="block mt-2 text-xs bg-[#0A1A2F] p-2 rounded text-[#FFD700]">
                  node scripts/seed-legal-ownership.js
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Legal Entities</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">{entities.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <FileSignature className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Active Agreements</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">
                  {agreements.filter((a) => a.status === "active").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Pending Reviews</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">
                  {
                    entities.filter((e) => e.verificationStatus === "under_review" || e.verificationStatus === "draft")
                      .length
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-[#B8C5D6] text-sm">Compliance Score</p>
                <p className="text-2xl font-bold text-[#F5F5F5]">
                  {entities.length > 0
                    ? Math.round(
                        (entities.filter((e) => e.verificationStatus === "verified").length / entities.length) * 100,
                      )
                    : 0}
                  %
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0D1F35] border border-[#2A3F55]">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="entities"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Legal Entities
            </TabsTrigger>
            <TabsTrigger
              value="agreements"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Agreements
            </TabsTrigger>
            <TabsTrigger
              value="responsibility"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]"
            >
              Responsibility Matrix
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Ownership */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Platform Ownership
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Legal entity owning the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entities.length > 0 ? (
                    entities.slice(0, 1).map((entity) => (
                      <div key={entity._id} className="p-4 bg-[#1A2F45] rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[#F5F5F5]">{entity.legalName}</h3>
                          <Badge className={getStatusBadge(entity.verificationStatus)}>
                            {entity.verificationStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[#B8C5D6]">Registration:</span>
                            <p className="text-[#F5F5F5] font-medium">{entity.registrationNumber}</p>
                          </div>
                          <div>
                            <span className="text-[#B8C5D6]">Type:</span>
                            <p className="text-[#F5F5F5] font-medium capitalize">{entity.entityType}</p>
                          </div>
                          <div>
                            <span className="text-[#B8C5D6]">Jurisdiction:</span>
                            <p className="text-[#F5F5F5] font-medium">{entity.jurisdiction?.country}</p>
                          </div>
                          <div>
                            <span className="text-[#B8C5D6]">Incorporated:</span>
                            <p className="text-[#F5F5F5] font-medium">
                              {entity.incorporationDate
                                ? new Date(entity.incorporationDate).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        {entity.beneficialOwners?.length > 0 && (
                          <div className="pt-2 border-t border-[#2A3F55]">
                            <p className="text-[#FFD700] text-sm font-medium mb-2">Beneficial Owners</p>
                            {entity.beneficialOwners.map((owner, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-[#B8C5D6]">{owner.name}</span>
                                <span className="text-[#F5F5F5]">{owner.ownershipPercentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 text-[#B8C5D6] mx-auto mb-3 opacity-50" />
                      <p className="text-[#B8C5D6] mb-4">No platform legal entity registered</p>
                      <Button
                        onClick={() => setShowEntityDialog(true)}
                        className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Legal Entity
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Software Ownership */}
              <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
                <CardHeader>
                  <CardTitle className="text-[#FFD700] flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Software Ownership Declaration
                  </CardTitle>
                  <CardDescription className="text-[#B8C5D6]">Platform software ownership status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entities.length > 0 && entities[0]?.softwareOwnership ? (
                    <div className="p-4 bg-[#1A2F45] rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#B8C5D6]">Ownership Type</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 capitalize">
                          {entities[0].softwareOwnership.ownershipType}
                        </Badge>
                      </div>
                      {entities[0].softwareOwnership.providerName && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#B8C5D6]">Provider</span>
                          <span className="text-[#F5F5F5]">{entities[0].softwareOwnership.providerName}</span>
                        </div>
                      )}
                      {entities[0].softwareOwnership.declaration && (
                        <div className="pt-3 border-t border-[#2A3F55]">
                          <p className="text-[#FFD700] text-sm font-medium mb-2">Declaration</p>
                          <p className="text-sm text-[#B8C5D6] leading-relaxed">
                            {entities[0].softwareOwnership.declaration}
                          </p>
                        </div>
                      )}
                      {entities[0].softwareOwnership.declaredBy && (
                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-[#B8C5D6]">Declared by:</span>
                          <span className="text-[#F5F5F5]">{entities[0].softwareOwnership.declaredBy}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-[#B8C5D6] mx-auto mb-3 opacity-50" />
                      <p className="text-[#B8C5D6]">No software ownership declaration on file</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Agreements */}
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#FFD700] flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Tenant Agreements
                    </CardTitle>
                    <CardDescription className="text-[#B8C5D6]">Formal contracts with tenants</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAgreementDialog(true)}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Agreement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {agreements.length > 0 ? (
                  <div className="space-y-3">
                    {agreements.map((agreement) => (
                      <div
                        key={agreement._id}
                        className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg hover:bg-[#1A2F45]/80 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItem(agreement)
                          setShowViewDialog(true)
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileSignature className="w-5 h-5 text-[#FFD700]" />
                          <div>
                            <h4 className="font-semibold text-[#F5F5F5]">{agreement.title}</h4>
                            <p className="text-sm text-[#B8C5D6]">
                              {agreement.tenantId?.name || "Unknown Tenant"} -{" "}
                              {agreement.agreementType?.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusBadge(agreement.status)}>{agreement.status}</Badge>
                          <Button variant="ghost" size="sm" className="text-[#FFD700]">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-[#B8C5D6] mx-auto mb-3 opacity-50" />
                    <p className="text-[#B8C5D6] mb-4">No tenant agreements on file</p>
                    <Button
                      onClick={() => setShowAgreementDialog(true)}
                      className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Agreement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Entities Tab */}
          <TabsContent value="entities" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetEntityForm() // Reset form for new entity creation
                  setShowEntityDialog(true)
                }}
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Legal Entity
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {entities.map((entity) => (
                <Card key={entity._id} className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-[#F5F5F5]">{entity.legalName}</CardTitle>
                        <CardDescription className="text-[#B8C5D6]">
                          {entity.tenantId?.name || "Platform Entity"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(entity.verificationStatus)}>{entity.verificationStatus}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntity(entity)}
                          className="text-[#FFD700]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[#B8C5D6]">Registration No.</p>
                        <p className="text-[#F5F5F5] font-semibold">{entity.registrationNumber}</p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Entity Type</p>
                        <p className="text-[#F5F5F5] font-semibold capitalize">{entity.entityType}</p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Jurisdiction</p>
                        <p className="text-[#F5F5F5] font-semibold">{entity.jurisdiction?.country}</p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Incorporation Date</p>
                        <p className="text-[#F5F5F5] font-semibold">
                          {entity.incorporationDate ? new Date(entity.incorporationDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Beneficial Owners */}
                    {entity.beneficialOwners?.length > 0 && (
                      <div className="pt-4 border-t border-[#2A3F55]">
                        <h4 className="text-[#FFD700] font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Beneficial Owners
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {entity.beneficialOwners.map((owner, idx) => (
                            <div key={idx} className="p-3 bg-[#1A2F45] rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-[#F5F5F5] font-medium">{owner.name}</span>
                                <span className="text-[#FFD700] font-bold">{owner.ownershipPercentage}%</span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-[#B8C5D6]">{owner.nationality || "N/A"}</span>
                                {owner.isPoliticallyExposed && (
                                  <Badge className="bg-red-500/20 text-red-400 text-xs">PEP</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Directors */}
                    {entity.directors?.length > 0 && (
                      <div className="pt-4 border-t border-[#2A3F55]">
                        <h4 className="text-[#FFD700] font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Directors & Officers
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {entity.directors.map((dir, idx) => (
                            <div key={idx} className="p-3 bg-[#1A2F45] rounded-lg">
                              <p className="text-[#F5F5F5] font-medium">{dir.name}</p>
                              <p className="text-sm text-[#B8C5D6]">{dir.position}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Licenses */}
                    {entity.licenses?.length > 0 && (
                      <div className="pt-4 border-t border-[#2A3F55]">
                        <h4 className="text-[#FFD700] font-semibold mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Licenses
                        </h4>
                        <div className="space-y-2">
                          {entity.licenses.map((lic, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                              <div>
                                <p className="text-[#F5F5F5] font-medium">{lic.licenseType}</p>
                                <p className="text-sm text-[#B8C5D6]">
                                  {lic.licenseNumber} - {lic.issuingAuthority}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusBadge(lic.status)}>{lic.status}</Badge>
                                <p className="text-xs text-[#B8C5D6] mt-1">
                                  Expires: {new Date(lic.expiryDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements" className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetAgreementForm() // Reset form for new agreement creation
                  setShowAgreementDialog(true)
                }}
                className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agreement
              </Button>
            </div>

            <div className="space-y-4">
              {agreements.map((agreement) => (
                <Card key={agreement._id} className="bg-[#0D1F35]/80 border-[#2A3F55]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#F5F5F5]">{agreement.title}</h3>
                        <p className="text-[#B8C5D6]">{agreement.referenceNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(agreement.status)}>{agreement.status}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgreement(agreement)}
                          className="text-[#FFD700]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#FFD700]"
                          onClick={() => {
                            setSelectedItem(agreement)
                            setShowViewDialog(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-[#B8C5D6]">Tenant</p>
                        <p className="text-[#F5F5F5] font-semibold">{agreement.tenantId?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Type</p>
                        <p className="text-[#F5F5F5] font-semibold capitalize">
                          {agreement.agreementType?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Effective Date</p>
                        <p className="text-[#F5F5F5] font-semibold">
                          {new Date(agreement.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#B8C5D6]">Expiry Date</p>
                        <p className="text-[#F5F5F5] font-semibold">
                          {agreement.expiryDate ? new Date(agreement.expiryDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>

                    {agreement.description && <p className="text-sm text-[#B8C5D6] mb-4">{agreement.description}</p>}

                    {agreement.responsibilities && (
                      <div className="pt-4 border-t border-[#2A3F55]">
                        <h4 className="text-[#FFD700] font-semibold mb-3">Responsibility Matrix</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {Object.entries(agreement.responsibilities).map(([key, value]) => (
                            <div key={key} className="p-2 bg-[#1A2F45] rounded">
                              <p className="text-[#B8C5D6] capitalize">{key.replace(/_/g, " ")}</p>
                              <p className="text-[#F5F5F5] font-semibold capitalize">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Responsibility Matrix Tab */}
          <TabsContent value="responsibility" className="space-y-6">
            <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
              <CardHeader>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Responsibility Matrix
                </CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Clear delineation of who handles what - critical for regulatory compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A3F55]">
                        <th className="text-left py-3 px-4 text-[#FFD700] font-semibold">Responsibility Area</th>
                        <th className="text-center py-3 px-4 text-[#FFD700] font-semibold">Platform</th>
                        <th className="text-center py-3 px-4 text-[#FFD700] font-semibold">Tenant</th>
                        <th className="text-center py-3 px-4 text-[#FFD700] font-semibold">Shared</th>
                        <th className="text-left py-3 px-4 text-[#FFD700] font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          area: "Payment Processing",
                          responsible: "tenant",
                          desc: "Tenant handles all deposits, withdrawals, and payment processing",
                        },
                        {
                          area: "AML/KYC Compliance",
                          responsible: "tenant",
                          desc: "Tenant verifies customer identity and monitors for suspicious activity",
                        },
                        {
                          area: "Customer Support",
                          responsible: "tenant",
                          desc: "Tenant provides direct support to end users",
                        },
                        {
                          area: "Risk Management",
                          responsible: "shared",
                          desc: "Platform provides tools; Tenant sets limits and monitors activity",
                        },
                        {
                          area: "Compliance Reporting",
                          responsible: "shared",
                          desc: "Platform generates reports; Tenant submits to regulators",
                        },
                        {
                          area: "Technical Infrastructure",
                          responsible: "platform",
                          desc: "Platform maintains all servers, databases, and technical systems",
                        },
                        {
                          area: "Data Protection",
                          responsible: "shared",
                          desc: "Platform secures infrastructure; Tenant ensures local GDPR/data compliance",
                        },
                        {
                          area: "User Funds Security",
                          responsible: "tenant",
                          desc: "Tenant holds and is solely responsible for all user deposits",
                        },
                        {
                          area: "Odds & Markets",
                          responsible: "platform",
                          desc: "Platform provides odds feed and market configurations",
                        },
                        {
                          area: "Licensing & Permits",
                          responsible: "tenant",
                          desc: "Tenant obtains and maintains all required gaming licenses",
                        },
                      ].map((item, idx) => (
                        <tr key={idx} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                          <td className="py-3 px-4 text-[#F5F5F5] font-medium">{item.area}</td>
                          <td className="text-center py-3 px-4">
                            {item.responsible === "platform" && (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.responsible === "tenant" && (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.responsible === "shared" && (
                              <CheckCircle className="w-5 h-5 text-yellow-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#B8C5D6] text-sm">{item.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-[#1A2F45] rounded-lg">
                  <h4 className="text-[#FFD700] font-semibold mb-2">Legend</h4>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-[#B8C5D6]">Sole Responsibility</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-[#B8C5D6]">Shared Responsibility</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Why This Matters</h4>
                <p className="text-[#B8C5D6] text-sm">
                  Regulators and banks require clear documentation of responsibilities. This matrix answers the critical
                  question: "If something goes wrong, who is responsible?" Having this documented protects both the
                  platform and tenants, and demonstrates regulatory maturity to financial institutions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Entity Dialog */}
      <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">{editMode ? "Edit Legal Entity" : "Add Legal Entity"}</DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              {editMode ? "Update legal entity details" : "Register a new legal entity for compliance documentation"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-[#FFD700] font-semibold">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#B8C5D6]">Tenant</Label>
                  <Select
                    value={entityForm.tenantId}
                    onValueChange={(val) => setEntityForm({ ...entityForm, tenantId: val })}
                    disabled={editMode}
                  >
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      {tenants && tenants.length > 0 ? (
                        tenants.map((t) => (
                          <SelectItem
                            key={t.id || t._id}
                            value={t.id || t._id}
                            className="text-[#F5F5F5] hover:bg-[#2A3F55]"
                          >
                            {t.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-[#8B9CAF]">No tenants available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Legal Name</Label>
                  <Input
                    value={entityForm.legalName}
                    onChange={(e) => setEntityForm({ ...entityForm, legalName: e.target.value })}
                    placeholder="Company Legal Name Ltd."
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Registration Number</Label>
                  <Input
                    value={entityForm.registrationNumber}
                    onChange={(e) => setEntityForm({ ...entityForm, registrationNumber: e.target.value })}
                    placeholder="RC-123456"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Entity Type</Label>
                  <Select
                    value={entityForm.entityType}
                    onValueChange={(val) => setEntityForm({ ...entityForm, entityType: val })}
                  >
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      <SelectItem value="corporation" className="text-[#F5F5F5]">
                        Corporation
                      </SelectItem>
                      <SelectItem value="llc" className="text-[#F5F5F5]">
                        LLC
                      </SelectItem>
                      <SelectItem value="partnership" className="text-[#F5F5F5]">
                        Partnership
                      </SelectItem>
                      <SelectItem value="sole_proprietorship" className="text-[#F5F5F5]">
                        Sole Proprietorship
                      </SelectItem>
                      <SelectItem value="other" className="text-[#F5F5F5]">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Incorporation Date</Label>
                  <Input
                    type="date"
                    value={entityForm.incorporationDate}
                    onChange={(e) => setEntityForm({ ...entityForm, incorporationDate: e.target.value })}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>

            {/* Jurisdiction */}
            <div className="space-y-4">
              <h4 className="text-[#FFD700] font-semibold">Jurisdiction</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#B8C5D6]">Country</Label>
                  <Input
                    value={entityForm.jurisdiction.country}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        jurisdiction: { ...entityForm.jurisdiction, country: e.target.value },
                      })
                    }
                    placeholder="Ethiopia"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">State/Region</Label>
                  <Input
                    value={entityForm.jurisdiction.state}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        jurisdiction: { ...entityForm.jurisdiction, state: e.target.value },
                      })
                    }
                    placeholder="Addis Ababa"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">City</Label>
                  <Input
                    value={entityForm.jurisdiction.city}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        jurisdiction: { ...entityForm.jurisdiction, city: e.target.value },
                      })
                    }
                    placeholder="Addis Ababa"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>

            {/* Registered Address */}
            <div className="space-y-4">
              <h4 className="text-[#FFD700] font-semibold">Registered Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-[#B8C5D6]">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={entityForm.registeredAddress?.street || ""}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        registeredAddress: { ...entityForm.registeredAddress, street: e.target.value },
                      })
                    }
                    placeholder="123 Business Street, Suite 100"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={entityForm.registeredAddress?.city || ""}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        registeredAddress: { ...entityForm.registeredAddress, city: e.target.value },
                      })
                    }
                    placeholder="Addis Ababa"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">State/Region</Label>
                  <Input
                    value={entityForm.registeredAddress?.state || ""}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        registeredAddress: { ...entityForm.registeredAddress, state: e.target.value },
                      })
                    }
                    placeholder="Addis Ababa Region"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Postal Code</Label>
                  <Input
                    value={entityForm.registeredAddress?.postalCode || ""}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        registeredAddress: { ...entityForm.registeredAddress, postalCode: e.target.value },
                      })
                    }
                    placeholder="1000"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={entityForm.registeredAddress?.country || ""}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        registeredAddress: { ...entityForm.registeredAddress, country: e.target.value },
                      })
                    }
                    placeholder="Ethiopia"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-[#FFD700] font-semibold">Contact Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[#B8C5D6]">Email</Label>
                  <Input
                    type="email"
                    value={entityForm.contact.primaryEmail}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        contact: { ...entityForm.contact, primaryEmail: e.target.value },
                      })
                    }
                    placeholder="legal@company.com"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Phone</Label>
                  <Input
                    value={entityForm.contact.phone}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        contact: { ...entityForm.contact, phone: e.target.value },
                      })
                    }
                    placeholder="+251-11-123-4567"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Website</Label>
                  <Input
                    value={entityForm.contact.website}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        contact: { ...entityForm.contact, website: e.target.value },
                      })
                    }
                    placeholder="https://company.com"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>

            {/* Beneficial Owners */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[#FFD700] font-semibold">Beneficial Owners</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBeneficialOwner}
                  className="border-[#2A3F55] text-[#FFD700] bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Owner
                </Button>
              </div>
              {entityForm.beneficialOwners.map((owner, idx) => (
                <div key={idx} className="p-4 bg-[#1A2F45] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B8C5D6] text-sm">Owner #{idx + 1}</span>
                    {entityForm.beneficialOwners.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBeneficialOwner(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Name</Label>
                      <Input
                        value={owner.name}
                        onChange={(e) => {
                          const updated = [...entityForm.beneficialOwners]
                          updated[idx].name = e.target.value
                          setEntityForm({ ...entityForm, beneficialOwners: updated })
                        }}
                        placeholder="Full Name"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Nationality</Label>
                      <Input
                        value={owner.nationality}
                        onChange={(e) => {
                          const updated = [...entityForm.beneficialOwners]
                          updated[idx].nationality = e.target.value
                          setEntityForm({ ...entityForm, beneficialOwners: updated })
                        }}
                        placeholder="Ethiopian"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Ownership %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={owner.ownershipPercentage}
                        onChange={(e) => {
                          const updated = [...entityForm.beneficialOwners]
                          updated[idx].ownershipPercentage = Number.parseFloat(e.target.value) || 0
                          setEntityForm({ ...entityForm, beneficialOwners: updated })
                        }}
                        placeholder="50"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id={`pep-${idx}`}
                      type="checkbox"
                      checked={owner.isPoliticallyExposed}
                      onChange={(e) => {
                        const updated = [...entityForm.beneficialOwners]
                        updated[idx].isPoliticallyExposed = e.target.checked
                        setEntityForm({ ...entityForm, beneficialOwners: updated })
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`pep-${idx}`} className="text-sm font-medium text-[#B8C5D6]">
                      Is Politically Exposed Person (PEP)
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Directors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[#FFD700] font-semibold">Directors & Officers</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDirector}
                  className="border-[#2A3F55] text-[#FFD700] bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Director
                </Button>
              </div>
              {entityForm.directors.map((dir, idx) => (
                <div key={idx} className="p-4 bg-[#1A2F45] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B8C5D6] text-sm">Director #{idx + 1}</span>
                    {entityForm.directors.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDirector(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Name</Label>
                      <Input
                        value={dir.name}
                        onChange={(e) => {
                          const updated = [...entityForm.directors]
                          updated[idx].name = e.target.value
                          setEntityForm({ ...entityForm, directors: updated })
                        }}
                        placeholder="Director's Full Name"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Position</Label>
                      <Input
                        value={dir.position}
                        onChange={(e) => {
                          const updated = [...entityForm.directors]
                          updated[idx].position = e.target.value
                          setEntityForm({ ...entityForm, directors: updated })
                        }}
                        placeholder="CEO, CFO, etc."
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#B8C5D6] text-xs">Nationality</Label>
                      <Input
                        value={dir.nationality}
                        onChange={(e) => {
                          const updated = [...entityForm.directors]
                          updated[idx].nationality = e.target.value
                          setEntityForm({ ...entityForm, directors: updated })
                        }}
                        placeholder="Nationality"
                        className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Software Ownership */}
            <div className="space-y-4">
              <h4 className="text-[#FFD700] font-semibold">Software Ownership Declaration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#B8C5D6]">Ownership Type</Label>
                  <Select
                    value={entityForm.softwareOwnership.ownershipType}
                    onValueChange={(val) =>
                      setEntityForm({
                        ...entityForm,
                        softwareOwnership: { ...entityForm.softwareOwnership, ownershipType: val },
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                      <SelectItem value="owned" className="text-[#F5F5F5]">
                        Owned (Full Ownership)
                      </SelectItem>
                      <SelectItem value="licensed" className="text-[#F5F5F5]">
                        Licensed (Third Party)
                      </SelectItem>
                      <SelectItem value="white_label" className="text-[#F5F5F5]">
                        White Label
                      </SelectItem>
                      <SelectItem value="saas" className="text-[#F5F5F5]">
                        SaaS
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Provider Name</Label>
                  <Input
                    value={entityForm.softwareOwnership.providerName}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        softwareOwnership: { ...entityForm.softwareOwnership, providerName: e.target.value },
                      })
                    }
                    placeholder="e.g., AWS, Microsoft Azure"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <Label className="text-[#B8C5D6]">Declared By</Label>
                  <Input
                    value={entityForm.softwareOwnership.declaredBy}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        softwareOwnership: { ...entityForm.softwareOwnership, declaredBy: e.target.value },
                      })
                    }
                    placeholder="Managing Director"
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-[#B8C5D6]">Declaration Statement</Label>
                  <Textarea
                    value={entityForm.softwareOwnership.declaration}
                    onChange={(e) =>
                      setEntityForm({
                        ...entityForm,
                        softwareOwnership: { ...entityForm.softwareOwnership, declaration: e.target.value },
                      })
                    }
                    placeholder="We hereby declare that the software used by our platform is legally owned/licensed by us..."
                    rows={3}
                    className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowEntityDialog(false)
                resetEntityForm() // Ensure form and edit states are reset on cancel
              }}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEntity} className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
              {editMode ? "Update Entity" : "Create Entity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Agreement Dialog */}
      <Dialog open={showAgreementDialog} onOpenChange={setShowAgreementDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">
              {editMode ? "Edit Tenant Agreement" : "Create Tenant Agreement"}
            </DialogTitle>
            <DialogDescription className="text-[#B8C5D6]">
              {editMode ? "Update tenant agreement details" : "Create a formal agreement with a tenant"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#B8C5D6]">Tenant</Label>
                <Select
                  value={agreementForm.tenantId}
                  onValueChange={(val) => setAgreementForm({ ...agreementForm, tenantId: val })}
                  disabled={editMode}
                >
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    {tenants.map((t) => (
                      <SelectItem
                        key={t.id || t._id}
                        value={t.id || t._id}
                        className="text-[#F5F5F5] hover:bg-[#2A3F55]"
                      >
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#B8C5D6]">Legal Entity</Label>
                <Select
                  value={agreementForm.legalEntityId}
                  onValueChange={(val) => setAgreementForm({ ...agreementForm, legalEntityId: val })}
                  disabled={editMode} // Disable legal entity selection when editing
                >
                  <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                    {entities.map((e) => (
                      <SelectItem key={e._id} value={e._id} className="text-[#F5F5F5]">
                        {e.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#B8C5D6]">Agreement Title</Label>
              <Input
                value={agreementForm.title}
                onChange={(e) => setAgreementForm({ ...agreementForm, title: e.target.value })}
                placeholder="Platform License Agreement 2025"
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>

            <div>
              <Label className="text-[#B8C5D6]">Agreement Type</Label>
              <Select
                value={agreementForm.agreementType}
                onValueChange={(val) => setAgreementForm({ ...agreementForm, agreementType: val })}
              >
                <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                  <SelectItem value="platform_license" className="text-[#F5F5F5]">
                    Platform License
                  </SelectItem>
                  <SelectItem value="white_label" className="text-[#F5F5F5]">
                    White Label
                  </SelectItem>
                  <SelectItem value="revenue_share" className="text-[#F5F5F5]">
                    Revenue Share
                  </SelectItem>
                  <SelectItem value="service_agreement" className="text-[#F5F5F5]">
                    Service Agreement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#B8C5D6]">Effective Date</Label>
                <Input
                  type="date"
                  value={agreementForm.effectiveDate}
                  onChange={(e) => setAgreementForm({ ...agreementForm, effectiveDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[#B8C5D6]">Expiry Date</Label>
                <Input
                  type="date"
                  value={agreementForm.expiryDate}
                  onChange={(e) => setAgreementForm({ ...agreementForm, expiryDate: e.target.value })}
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#B8C5D6]">Description</Label>
              <Textarea
                value={agreementForm.description}
                onChange={(e) => setAgreementForm({ ...agreementForm, description: e.target.value })}
                placeholder="Agreement description..."
                rows={3}
                className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-[#FFD700] font-semibold">Responsibility Matrix</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(agreementForm.responsibilities).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-[#B8C5D6] capitalize text-xs">{key.replace(/_/g, " ")}</Label>
                    <Select
                      value={value}
                      onValueChange={(val) =>
                        setAgreementForm({
                          ...agreementForm,
                          responsibilities: { ...agreementForm.responsibilities, [key]: val },
                        })
                      }
                    >
                      <SelectTrigger className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A2F45] border-[#2A3F55]">
                        <SelectItem value="platform" className="text-[#F5F5F5]">
                          Platform
                        </SelectItem>
                        <SelectItem value="tenant" className="text-[#F5F5F5]">
                          Tenant
                        </SelectItem>
                        <SelectItem value="shared" className="text-[#F5F5F5]">
                          Shared
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAgreementDialog(false)
                resetAgreementForm() // Ensure form and edit states are reset on cancel
              }}
              className="border-[#2A3F55] text-[#B8C5D6]"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAgreement} className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
              {editMode ? "Update Agreement" : "Create Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Agreement Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#B8C5D6]">Reference</p>
                  <p className="text-[#F5F5F5] font-semibold">{selectedItem.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6]">Status</p>
                  <Badge className={getStatusBadge(selectedItem.status)}>{selectedItem.status}</Badge>
                </div>
                <div>
                  <p className="text-[#B8C5D6]">Effective Date</p>
                  <p className="text-[#F5F5F5]">{new Date(selectedItem.effectiveDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[#B8C5D6]">Expiry Date</p>
                  <p className="text-[#F5F5F5]">
                    {selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <p className="text-[#B8C5D6]">Description</p>
                  <p className="text-[#F5F5F5]">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setShowViewDialog(false)}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">How Legal & Ownership Traceability Works</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-[#FFD700] font-semibold mb-2">Why This Matters</h3>
              <p className="text-[#B8C5D6]">
                Regulators and banks will ask: "Who owns what, and who is responsible?" This system provides documented
                answers that satisfy due diligence requirements.
              </p>
            </div>

            <div>
              <h3 className="text-[#FFD700] font-semibold mb-2">What to Document</h3>
              <ul className="space-y-2 text-[#B8C5D6]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Platform Owner</strong> - Your company's legal entity with beneficial owners (anyone owning
                    25%+)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Software Ownership</strong> - Declaration stating you own/license the software legally
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tenant Agreements</strong> - Formal contracts defining relationships with each tenant
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Responsibility Matrix</strong> - Clear table showing who handles payments, AML, support,
                    risk
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#FFD700] font-semibold mb-2">How to Present to Regulators</h3>
              <ol className="space-y-2 text-[#B8C5D6] list-decimal list-inside">
                <li>Click "Export Full Report" to generate a PDF with all documentation</li>
                <li>Include your company registration documents</li>
                <li>Show beneficial owner identification</li>
                <li>Present the responsibility matrix showing clear liability boundaries</li>
              </ol>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="text-blue-400 font-semibold mb-2">Pro Tip</h3>
              <p className="text-[#B8C5D6]">
                Even mock contracts and diagrams add massive credibility. Having templates shows regulatory maturity and
                preparedness, even before you have actual signed agreements.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowHelpDialog(false)}
              className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]"
            >
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  )
}
