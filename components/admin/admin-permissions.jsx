"use client"
import { useState } from "react"
import { Card3D } from "@/components/ui/3d-card"
import { BrandedButton } from "@/components/ui/branded-button"
import { Shield, Save, AlertCircle, DollarSign, Globe, Lock, GitBranch, Settings } from "lucide-react"

export function AdminPermissions() {
  const [permissions, setPermissions] = useState({
    financialControls: false,
    currencyLanguage: false,
    posMasking: false,
    matchRouting: false,
    agentControls: false,
  })

  const [saved, setSaved] = useState(false)

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSaved(false)
  }

  const savePermissions = () => {
    localStorage.setItem("adminPermissions", JSON.stringify(permissions))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const permissionList = [
    {
      id: "financialControls",
      label: "Financial Controls",
      description: "Allow admin to manage betting limits, taxes, and cashback rewards",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      id: "currencyLanguage",
      label: "Currency & Language",
      description: "Allow admin to configure currency and language settings",
      icon: Globe,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "posMasking",
      label: "POS Masking",
      description: "Allow admin to configure privacy settings for specific regions",
      icon: Lock,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "matchRouting",
      label: "Match Routing",
      description: "Allow admin to configure match routing and odds management",
      icon: GitBranch,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "agentControls",
      label: "Agent Controls",
      description: "Allow admin to manage agent slips and deletion rules",
      icon: Settings,
      color: "from-cyan-500 to-cyan-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Permissions</h2>
        <p className="text-muted-foreground">Grant admin users access to specific administrative controls</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center animate-pulse">
          Admin permissions saved successfully!
        </div>
      )}

      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-[#F5F5F5] mb-2">Permission Management</h3>
              <p className="text-sm text-muted-foreground">
                Control which administrative features your admin users can access. These settings apply to all users
                with the Admin role in your tenant.
              </p>
            </div>
          </div>
        </div>
      </Card3D>

      <div className="space-y-4">
        {permissionList.map((permission) => (
          <Card3D key={permission.id}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${permission.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <permission.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{permission.label}</h3>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePermission(permission.id)}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                    permissions[permission.id] ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                      permissions[permission.id] ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card3D>
        ))}
      </div>

      <BrandedButton
        variant="primary"
        className="w-full flex items-center justify-center gap-2"
        onClick={savePermissions}
      >
        <Save className="w-5 h-5" />
        Save Permissions
      </BrandedButton>

      <Card3D>
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-400 mb-2">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Only grant permissions to trusted admin users</li>
                <li>• Changes take effect immediately for all admin users</li>
                <li>• Super Admin and Tenant always have full access</li>
                <li>• Admin users can only see features they have permission for</li>
              </ul>
            </div>
          </div>
        </div>
      </Card3D>
    </div>
  )
}
