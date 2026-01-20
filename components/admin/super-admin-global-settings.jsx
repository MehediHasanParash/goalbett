"use client"

import { useState } from "react"
import { Save, RefreshCw, Key, Database, Shield, Zap, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PasswordChangeCard } from "./password-change-card"
import { UNIQUE_CURRENCY_OPTIONS } from "@/lib/currency-config"

export function SuperAdminGlobalSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  const [settings, setSettings] = useState({
    // General Settings
    platformName: "Goal Bett Platform",
    defaultCurrency: "USD",
    platformTimezone: "UTC",
    maintenanceMode: false,

    // Sports Feed Provider
    sportsFeedProvider: "sportradar",
    sportsFeedApiKey: "••••••••••••••••",
    oddsUpdateFrequency: 5, // minutes

    // API & Integration Keys
    apiSettings: {
      jwtSecret: "••••••••••••••••",
      apiRateLimit: 1000, // requests per minute
      webhookTimeout: 30, // seconds
      enableApiLogging: true,
    },

    // Risk Management Global
    globalRiskSettings: {
      maxBetAmount: 50000,
      maxDailyExposure: 1000000,
      maxWinAmount: 500000,
      suspiciousActivityThreshold: 100000,
      autoSuspendThreshold: 200000,
    },

    // Compliance Settings
    complianceSettings: {
      enableKYC: true,
      kycThreshold: 10000, // trigger at this amount
      enableAML: true,
      amlCheckProvider: "trulioo",
      enableGeoRestriction: true,
      restrictedCountries: ["US", "CN", "RU"],
      enableResponsibleGambling: true,
      minPlayerAge: 18,
    },

    // Notification Settings
    notificationSettings: {
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      enablePushNotifications: true,
      suspiciousActivityAlert: true,
      highRiskBetAlert: true,
      systemHealthAlert: true,
    },

    // System Health
    systemHealthSettings: {
      enableMonitoring: true,
      healthCheckInterval: 5, // minutes
      logRetentionDays: 90,
      enableAutoBackup: true,
      backupFrequency: "daily",
    },

    // Security Settings
    securitySettings: {
      enableTwoFA: true,
      requireStrongPasswords: true,
      sessionTimeout: 60, // minutes
      ipWhitelistEnabled: false,
      bruteForceProtection: true,
      maxLoginAttempts: 5,
    },
  })

  const handleFieldChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleGeneralFieldChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Global System Settings</h1>
        <p className="text-[#B8C5D6]">Configure platform-wide settings and integrations</p>
      </div>

      {/* Save Status */}
      {savedMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-center animate-pulse">
          Settings saved successfully!
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-[#1A2F45] border-b border-[#2A3F55]">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="api"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            API
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            Risk
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            Compliance
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            System
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F] text-xs md:text-sm"
          >
            <Lock className="w-4 h-4 mr-1" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">Platform Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => handleGeneralFieldChange("platformName", e.target.value)}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Default Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => handleGeneralFieldChange("defaultCurrency", e.target.value)}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  >
                    {UNIQUE_CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Platform Timezone</label>
                  <select
                    value={settings.platformTimezone}
                    onChange={(e) => handleGeneralFieldChange("platformTimezone", e.target.value)}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleGeneralFieldChange("maintenanceMode", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                  <label className="text-[#B8C5D6] text-sm font-semibold cursor-pointer">
                    Maintenance Mode
                    {settings.maintenanceMode && <Badge className="ml-2 bg-orange-500 text-xs">Enabled</Badge>}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Sports Feed Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Provider</label>
                  <select
                    value={settings.sportsFeedProvider}
                    onChange={(e) => handleGeneralFieldChange("sportsFeedProvider", e.target.value)}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="sportradar">Sportradar</option>
                    <option value="betgenius">Betgenius</option>
                    <option value="betradar">Betradar</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Update Frequency (minutes)</label>
                  <input
                    type="number"
                    value={settings.oddsUpdateFrequency}
                    onChange={(e) => handleGeneralFieldChange("oddsUpdateFrequency", Number.parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                    min="1"
                    max="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={settings.apiSettings.apiRateLimit}
                    onChange={(e) => handleFieldChange("apiSettings", "apiRateLimit", Number.parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Webhook Timeout (sec)</label>
                  <input
                    type="number"
                    value={settings.apiSettings.webhookTimeout}
                    onChange={(e) =>
                      handleFieldChange("apiSettings", "webhookTimeout", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={settings.apiSettings.enableApiLogging}
                  onChange={(e) => handleFieldChange("apiSettings", "enableApiLogging", e.target.checked)}
                  className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                />
                <label className="text-[#B8C5D6] text-sm font-semibold cursor-pointer">Enable API Logging</label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Settings Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Global Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Max Bet Amount</label>
                  <input
                    type="number"
                    value={settings.globalRiskSettings.maxBetAmount}
                    onChange={(e) =>
                      handleFieldChange("globalRiskSettings", "maxBetAmount", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Max Daily Exposure</label>
                  <input
                    type="number"
                    value={settings.globalRiskSettings.maxDailyExposure}
                    onChange={(e) =>
                      handleFieldChange("globalRiskSettings", "maxDailyExposure", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Max Win Amount</label>
                  <input
                    type="number"
                    value={settings.globalRiskSettings.maxWinAmount}
                    onChange={(e) =>
                      handleFieldChange("globalRiskSettings", "maxWinAmount", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">
                    Suspicious Activity Threshold
                  </label>
                  <input
                    type="number"
                    value={settings.globalRiskSettings.suspiciousActivityThreshold}
                    onChange={(e) =>
                      handleFieldChange(
                        "globalRiskSettings",
                        "suspiciousActivityThreshold",
                        Number.parseInt(e.target.value),
                      )
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compliance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Enable KYC</span>
                  <input
                    type="checkbox"
                    checked={settings.complianceSettings.enableKYC}
                    onChange={(e) => handleFieldChange("complianceSettings", "enableKYC", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Enable AML</span>
                  <input
                    type="checkbox"
                    checked={settings.complianceSettings.enableAML}
                    onChange={(e) => handleFieldChange("complianceSettings", "enableAML", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Geo Restriction</span>
                  <input
                    type="checkbox"
                    checked={settings.complianceSettings.enableGeoRestriction}
                    onChange={(e) => handleFieldChange("complianceSettings", "enableGeoRestriction", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Responsible Gambling</span>
                  <input
                    type="checkbox"
                    checked={settings.complianceSettings.enableResponsibleGambling}
                    onChange={(e) =>
                      handleFieldChange("complianceSettings", "enableResponsibleGambling", e.target.checked)
                    }
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Minimum Player Age</label>
                <input
                  type="number"
                  value={settings.complianceSettings.minPlayerAge}
                  onChange={(e) =>
                    handleFieldChange("complianceSettings", "minPlayerAge", Number.parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  min="18"
                  max="21"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Enable 2FA</span>
                  <input
                    type="checkbox"
                    checked={settings.securitySettings.enableTwoFA}
                    onChange={(e) => handleFieldChange("securitySettings", "enableTwoFA", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Require Strong Passwords</span>
                  <input
                    type="checkbox"
                    checked={settings.securitySettings.requireStrongPasswords}
                    onChange={(e) => handleFieldChange("securitySettings", "requireStrongPasswords", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Brute Force Protection</span>
                  <input
                    type="checkbox"
                    checked={settings.securitySettings.bruteForceProtection}
                    onChange={(e) => handleFieldChange("securitySettings", "bruteForceProtection", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">IP Whitelist</span>
                  <input
                    type="checkbox"
                    checked={settings.securitySettings.ipWhitelistEnabled}
                    onChange={(e) => handleFieldChange("securitySettings", "ipWhitelistEnabled", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Session Timeout (min)</label>
                  <input
                    type="number"
                    value={settings.securitySettings.sessionTimeout}
                    onChange={(e) =>
                      handleFieldChange("securitySettings", "sessionTimeout", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      handleFieldChange("securitySettings", "maxLoginAttempts", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Enable Monitoring</span>
                  <input
                    type="checkbox"
                    checked={settings.systemHealthSettings.enableMonitoring}
                    onChange={(e) => handleFieldChange("systemHealthSettings", "enableMonitoring", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1A2F45] rounded-lg">
                  <span className="text-[#F5F5F5]">Auto Backup</span>
                  <input
                    type="checkbox"
                    checked={settings.systemHealthSettings.enableAutoBackup}
                    onChange={(e) => handleFieldChange("systemHealthSettings", "enableAutoBackup", e.target.checked)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Health Check Interval (min)</label>
                  <input
                    type="number"
                    value={settings.systemHealthSettings.healthCheckInterval}
                    onChange={(e) =>
                      handleFieldChange("systemHealthSettings", "healthCheckInterval", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-[#B8C5D6] text-sm font-semibold mb-2">Log Retention (days)</label>
                  <input
                    type="number"
                    value={settings.systemHealthSettings.logRetentionDays}
                    onChange={(e) =>
                      handleFieldChange("systemHealthSettings", "logRetentionDays", Number.parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-[#1A2F45] border border-[#2A3F55] text-[#F5F5F5] rounded-lg focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <PasswordChangeCard
            title="Change Your Password"
            description="Update your super admin account password for security"
          />

          {/* 2FA Section - Coming Soon */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-[#1A2F45] rounded-lg">
                <div>
                  <p className="text-[#F5F5F5] font-medium">Enable 2FA for your account</p>
                  <p className="text-sm text-[#B8C5D6]">Add an extra layer of security to your admin account</p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-[#B8C5D6] text-[#B8C5D6] bg-transparent hover:bg-[#1A2F45]">
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F] font-bold"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
