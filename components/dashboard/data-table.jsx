"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export function DataTable({ columns, data, onRowClick, rowClassName, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedData = data.slice(startIdx, endIdx)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-[#2A3F55]">
        <Table>
          <TableHeader className="bg-[#1A2F45]/50 border-b border-[#2A3F55]">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="text-[#B8C5D6] font-bold">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#2A3F55] hover:bg-[#1A2F45]/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClassName?.(row) || ""}`}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-[#F5F5F5]">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[#B8C5D6] text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
