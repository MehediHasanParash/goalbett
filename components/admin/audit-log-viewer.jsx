"use client"

import { useState } from "react"
import { Eye, Copy } from "lucide-react"
import { format } from "date-fns"

export function AuditLogViewer() {
  const [logs, setLogs] = useState([
    {
      id: 1,
      action: "Provider Upload",
      user: "superadmin_1",
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      details: "Uploaded 25 games from NetEnt provider",
      status: "success",
    },
    {
      id: 2,
      action: "Tenant Created",
      user: "superadmin_1",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      details: "Created new tenant: BetShop Kenya",
      status: "success",
    },
    {
      id: 3,
      action: "Promotion Toggle",
      user: "tenant_1",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      details: "Enabled welcome bonus promotion",
      status: "success",
    },
    {
      id: 4,
      action: "User Role Change",
      user: "superadmin_1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      details: "Promoted user_123 to Agent",
      status: "success",
    },
    {
      id: 5,
      action: "Failed Auth Attempt",
      user: "unknown",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      details: "Multiple failed login attempts from IP: 192.168.x.x",
      status: "warning",
    },
  ])

  const [selectedLog, setSelectedLog] = useState(null)

  return (
    <div className="bg-[#0D1F35]/80 backdrop-blur-sm border border-[#2A3F55] rounded-xl p-6">
      <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">Audit Logs</h3>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["All", "Provider Upload", "Tenant Created", "Promotion", "User Role"].map((filter) => (
          <button
            key={filter}
            className="px-3 py-1 bg-[#1A2F45] text-[#B8C5D6] rounded-full text-sm hover:bg-[#FFD700] hover:text-[#0A1A2F] transition-colors whitespace-nowrap"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A3F55]">
              <th className="px-4 py-3 text-left text-[#B8C5D6] font-semibold">Action</th>
              <th className="px-4 py-3 text-left text-[#B8C5D6] font-semibold">User</th>
              <th className="px-4 py-3 text-left text-[#B8C5D6] font-semibold">Time</th>
              <th className="px-4 py-3 text-left text-[#B8C5D6] font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-[#B8C5D6] font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[#2A3F55] hover:bg-[#1A2F45]/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-[#F5F5F5] font-medium">{log.action}</span>
                </td>
                <td className="px-4 py-3 text-[#B8C5D6]">{log.user}</td>
                <td className="px-4 py-3 text-[#B8C5D6]">{format(new Date(log.timestamp), "MMM dd, HH:mm")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === "success" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1 hover:bg-[#2A3F55] rounded transition-colors"
                  >
                    <Eye className="w-4 h-4 text-[#FFD700]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A1A2F] border border-[#2A3F55] rounded-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-[#F5F5F5] mb-4">{selectedLog.action} Details</h4>
            <div className="space-y-3 mb-6 text-sm">
              <div>
                <span className="text-[#B8C5D6]">User:</span>
                <span className="text-[#F5F5F5] ml-2">{selectedLog.user}</span>
              </div>
              <div>
                <span className="text-[#B8C5D6]">Time:</span>
                <span className="text-[#F5F5F5] ml-2">{format(new Date(selectedLog.timestamp), "PPpp")}</span>
              </div>
              <div>
                <span className="text-[#B8C5D6]">Details:</span>
                <p className="text-[#F5F5F5] mt-1">{selectedLog.details}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))
                }}
                className="flex-1 py-2 bg-[#1A2F45] text-[#B8C5D6] rounded-lg hover:bg-[#2A3F55] transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-2 bg-[#FFD700] text-[#0A1A2F] rounded-lg hover:bg-[#FFD700]/90 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
