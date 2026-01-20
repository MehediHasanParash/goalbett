"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { AdminControlsSettings } from "@/components/admin/admin-controls-settings"

export default function AdminControlsPage() {
  return (
    <SuperAdminLayout title="Admin Controls" description="System-wide administrative controls">
      <AdminControlsSettings />
    </SuperAdminLayout>
  )
}
