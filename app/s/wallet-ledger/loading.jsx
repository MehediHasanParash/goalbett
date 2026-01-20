import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"

export default function Loading() {
  return (
    <SuperAdminLayout title="Wallet & Ledger" description="Double-entry accounting system for financial tracking">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-[#1A2F45] rounded w-24 mb-3" />
            <div className="h-8 bg-[#1A2F45] rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-[#0D1F35] border border-[#2A3F55] rounded-xl p-8 animate-pulse">
        <div className="h-6 bg-[#1A2F45] rounded w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1A2F45] rounded" />
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
