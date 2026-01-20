"use client"

import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { useState } from "react"

export function FilterBar({ searchPlaceholder = "Search...", onSearch, onFilterChange, filters = [] }) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [activeFilters, setActiveFilters] = useState({})

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch?.(value)
  }

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    setSearchValue("")
    setActiveFilters({})
    onSearch?.("")
    onFilterChange?.({})
  }

  const hasActiveFilters = searchValue || Object.values(activeFilters).some(Boolean)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8C5D6]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-[#1A2F45] border border-[#2A3F55] rounded-lg text-[#F5F5F5] placeholder-[#B8C5D6] focus:border-[#FFD700] outline-none transition-colors"
          />
        </div>

        {filters.length > 0 && (
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}

        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="ghost" size="sm" className="text-[#B8C5D6] hover:text-red-400">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="p-4 bg-[#1A2F45]/50 rounded-lg border border-[#2A3F55] space-y-3">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="text-[#B8C5D6] text-sm font-medium block mb-2">{filter.label}</label>
              {filter.type === "select" ? (
                <select
                  value={activeFilters[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A1A2F] border border-[#2A3F55] rounded text-[#F5F5F5]"
                >
                  <option value="">All</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type}
                  value={activeFilters[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-4 py-2 bg-[#0A1A2F] border border-[#2A3F55] rounded text-[#F5F5F5]"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
