"use client"

import { Search, X } from "lucide-react"
import { useState } from "react"

interface SearchBarProps {
  onSearch?: (query: string) => void
  onClose?: () => void
}

export default function SearchBar({ onSearch, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("")

  const suggestions = [
    { type: "cat", name: "Luna", location: "Oak Street Park" },
    { type: "cat", name: "Shadow", location: "Downtown Alley" },
    { type: "location", name: "Oak Street Park" },
    { type: "tag", name: "friendly cats" },
    { type: "tag", name: "kittens" },
  ]

  const filtered = query ? suggestions.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())) : []

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-md z-50 flex flex-col safe-area-inset">
      <div className="glass-solid px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 glass rounded-2xl px-4 py-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cats, locations, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="glass-button p-1.5 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-primary text-sm font-semibold px-2">
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background/80 backdrop-blur-sm">
        {filtered.length > 0 ? (
          <div className="px-4 py-3 space-y-2">
            {filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSearch?.(item.name)
                  onClose?.()
                }}
                className="w-full glass rounded-2xl p-4 text-left hover:scale-[1.01] transition-transform flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  {item.type === "cat" ? "🐱" : item.type === "location" ? "📍" : "#"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.type === "cat" && <p className="text-xs text-muted-foreground">{(item as any).location}</p>}
                </div>
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="glass rounded-full p-6 mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Recent Searches</p>
              <div className="space-y-2">
                {["Luna", "Oak Street Park", "Kittens"].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left glass rounded-2xl px-4 py-3 text-sm text-foreground hover:scale-[1.01] transition-transform"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
