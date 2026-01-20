"use client"

import { useState, useEffect } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChevronRight,
  ChevronDown,
  Search,
  User,
  Wallet,
  TrendingUp,
  MoreVertical,
  RefreshCw,
} from "lucide-react"

// Tree Node Component
function AgentTreeNode({ agent, level = 0, expandedNodes, toggleNode }) {
  const isExpanded = expandedNodes.has(agent._id)
  const hasChildren = agent.subAgents && agent.subAgents.length > 0

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 p-3 rounded-lg hover:bg-[#1A2F45] cursor-pointer transition-colors ${
          level === 0 ? "bg-[#1A2F45]" : ""
        }`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => hasChildren && toggleNode(agent._id)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#FFD700]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#B8C5D6]" />
          )
        ) : (
          <div className="w-4" />
        )}

        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            level === 0 ? "bg-[#FFD700] text-[#0A1A2F]" : "bg-[#2A3F55] text-white"
          }`}
        >
          <User className="w-4 h-4" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{agent.name}</span>
            <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-xs">
              {agent.status}
            </Badge>
            {level === 0 && <Badge className="bg-[#FFD700] text-[#0A1A2F] text-xs">Master</Badge>}
          </div>
          <div className="flex items-center gap-4 text-xs text-[#B8C5D6]">
            <span>{agent.playersCount || 0} players</span>
            <span>{agent.subAgents?.length || 0} sub-agents</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-green-400 font-medium">${(agent.walletBalance || 0).toLocaleString()}</p>
          <p className="text-xs text-[#B8C5D6]">{agent.commissionRate || 15}% commission</p>
        </div>

        <Button variant="ghost" size="icon" className="text-[#B8C5D6]">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {isExpanded && hasChildren && (
        <div className="border-l-2 border-[#2A3F55] ml-6">
          {agent.subAgents.map((subAgent) => (
            <AgentTreeNode
              key={subAgent._id}
              agent={subAgent}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AgentHierarchyPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalFloat: 0,
    totalPlayers: 0,
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      const res = await fetch("/api/super/agent-hierarchy", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setAgents(data.agents || [])
        setStats({
          totalAgents: data.total || 0,
          activeAgents: data.active || 0,
          totalFloat: data.totalFloat || 0,
          totalPlayers: data.totalPlayers || 0,
        })

        // Expand root nodes by default
        setExpandedNodes(new Set(data.agents?.map((a) => a._id) || []))
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const expandAll = () => {
    const getAllIds = (agents) => {
      let ids = []
      agents.forEach((agent) => {
        ids.push(agent._id)
        if (agent.subAgents) {
          ids = [...ids, ...getAllIds(agent.subAgents)]
        }
      })
      return ids
    }
    setExpandedNodes(new Set(getAllIds(agents)))
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const filteredAgents = agents.filter((agent) => agent.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <SuperAdminLayout title="Agent Hierarchy" description="Visual agent network structure">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Agents</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Active Agents</p>
                  <p className="text-2xl font-bold text-white">{stats.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Float</p>
                  <p className="text-2xl font-bold text-white">${stats.totalFloat.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D1F35] border-[#2A3F55]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[#B8C5D6] text-sm">Total Players</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hierarchy Tree */}
        <Card className="bg-[#0D1F35] border-[#2A3F55]">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-[#FFD700] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Network Tree
                </CardTitle>
                <CardDescription className="text-[#B8C5D6]">
                  Click on agents to expand/collapse their sub-agents
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0A1A2F] border-[#2A3F55] text-white w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                >
                  Collapse All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAgents}
                  className="border-[#2A3F55] text-[#B8C5D6] bg-transparent"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-[#B8C5D6]">Loading hierarchy...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-[#B8C5D6]">No agents found</div>
            ) : (
              <div className="space-y-2">
                {filteredAgents.map((agent) => (
                  <AgentTreeNode
                    key={agent._id}
                    agent={agent}
                    level={0}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  )
}
