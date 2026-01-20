import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status, className }) {
  const statusStyles = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    settled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  return (
    <Badge className={`${statusStyles[status] || statusStyles.pending} border capitalize text-xs ${className}`}>
      {status}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }) {
  return <StatusBadge status={status} />
}

export function KYCStatusBadge({ status }) {
  return <StatusBadge status={status} />
}
