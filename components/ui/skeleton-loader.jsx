"use client"

export function SkeletonCard() {
  return (
    <div className="bg-[#1A2F45] rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-[#0A1A2F] rounded mb-3 w-3/4"></div>
      <div className="h-3 bg-[#0A1A2F] rounded mb-2 w-full"></div>
      <div className="h-3 bg-[#0A1A2F] rounded w-5/6"></div>
    </div>
  )
}

export function SkeletonBetSlip() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="bg-[#1A2F45] rounded-lg p-4">
            <div className="h-4 bg-[#0A1A2F] rounded mb-3 w-2/3"></div>
            <div className="h-3 bg-[#0A1A2F] rounded w-full"></div>
          </div>
        ))}
    </div>
  )
}

export function SkeletonMatchCard() {
  return (
    <div className="bg-[#1A2F45] rounded-lg p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-[#0A1A2F] rounded w-1/3"></div>
        <div className="h-4 bg-[#0A1A2F] rounded w-1/4"></div>
      </div>
      <div className="h-12 bg-[#0A1A2F] rounded"></div>
      <div className="grid grid-cols-3 gap-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-8 bg-[#0A1A2F] rounded"></div>
          ))}
      </div>
    </div>
  )
}
