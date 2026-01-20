"use client"

import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { NotificationSystem } from "@/components/admin/notification-system"

export default function NotificationsPage() {
  return (
    <SuperAdminLayout title="Notification System" description="Manage push notifications and announcements">
      <NotificationSystem />
    </SuperAdminLayout>
  )
}
