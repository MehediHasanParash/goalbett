"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { SuperAdminGlobalSettings } from "@/components/admin/super-admin-global-settings"

export default function SettingsPage() {
  return (
    <SuperAdminLayout title="Global Settings" description="Platform-wide configuration and settings">
      <SuperAdminGlobalSettings />
    </SuperAdminLayout>
  )
}
