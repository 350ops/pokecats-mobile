"use client"

import { X, Filter } from "lucide-react"
import { useState } from "react"

interface MapFiltersProps {
  onClose: () => void
  onApply?: (filters: FilterState) => void
}

interface FilterState {
  status: string[]
  lastSeen: string
  fed: boolean
}

export default function MapFilters({ onClose, onApply }: MapFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    lastSeen: "all",
    fed: false,
  })

  const statusOptions = ["friendly", "shy", "healthy", "needs-help", "kitten"]
  const lastSeenOptions = [
    { value: "all", label: "All time" },
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ]

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status],
    }))
  }

  const handleApply = () => {
    onApply?.(filters)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end safe-area-inset-bottom">
      <div className="w-full bg-card rounded-t-3xl p-6 animate-in slide-in-from-bottom max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Cats
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Status Filter */}
          <div>
            <p className="font-semibold text-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.status.includes(status)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Last Seen Filter */}
          <div>
            <p className="font-semibold text-foreground mb-2">Last Seen</p>
            <div className="space-y-2">
              {lastSeenOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                >
                  <input
                    type="radio"
                    name="lastSeen"
                    value={option.value}
                    checked={filters.lastSeen === option.value}
                    onChange={() => setFilters((prev) => ({ ...prev, lastSeen: option.value }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fed Today */}
          <label className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={filters.fed}
              onChange={() => setFilters((prev) => ({ ...prev, fed: !prev.fed }))}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground font-medium">Show only unfed cats</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setFilters({ status: [], lastSeen: "all", fed: false })}
            className="flex-1 border border-border text-foreground rounded-xl py-3 font-semibold hover:bg-muted transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
