"use client"

import { useState } from "react"
import { Power } from "lucide-react"

export default function ProviderManagement() {
  const [providers, setProviders] = useState([
    { id: 1, name: "Pragmatic Play", status: "active", games: 124, lastUpdated: "2024-01-20" },
    { id: 2, name: "Microgaming", status: "active", games: 89, lastUpdated: "2024-01-15" },
    { id: 3, name: "NetEnt", status: "inactive", games: 67, lastUpdated: "2024-01-10" },
    { id: 4, name: "BGaming", status: "active", games: 45, lastUpdated: "2024-01-18" },
  ])

  const toggleProvider = (id) => {
    setProviders(
      providers.map((p) => (p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)),
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Provider Management</h2>
        <p className="text-muted-foreground mb-6">Enable or disable providers globally across all tenants</p>
      </div>

      {/* Providers Grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Provider</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Games</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Last Updated</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-lg">🎮</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">Provider ID: {provider.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-muted rounded-full text-sm font-semibold text-foreground">
                      {provider.games}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(provider.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        provider.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleProvider(provider.id)}
                      className={`px-3 py-1 rounded transition-colors flex items-center gap-2 text-sm font-semibold ${
                        provider.status === "active"
                          ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                      }`}
                    >
                      <Power size={16} />
                      {provider.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
