"use client"

import { Heart, MapPin, Clock, TrendingUp } from "lucide-react"

interface CatCardProps {
  cat: {
    id: number
    name: string
    image: string
    location: string
    status: string
    tags: string[]
    lastSeen: string
    followers: number
    distance?: string
    healthStatus?: "healthy" | "warning" | "needs-help"
  }
  onClick?: () => void
}

export default function CatCard({ cat, onClick }: CatCardProps) {
  const healthColors = {
    healthy: "bg-green-400 shadow-green-400/50",
    warning: "bg-amber-400 shadow-amber-400/50",
    "needs-help": "bg-red-400 shadow-red-400/50",
  }

  const healthStatus = cat.healthStatus || "healthy"

  return (
    <button
      onClick={onClick}
      className="w-full glass rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-[0.98] text-left liquid-card"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={cat.image || "/placeholder.svg"} alt={cat.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />

        <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${healthColors[healthStatus]} shadow-lg`} />

        <button
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="absolute top-4 right-4 glass-subtle rounded-full p-2.5 hover:scale-110 transition-transform"
        >
          <Heart className="w-4 h-4 text-accent" />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-xl text-white drop-shadow-lg">{cat.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {cat.distance && (
              <span className="text-xs glass-subtle px-2.5 py-1 rounded-full text-foreground font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {cat.distance}
              </span>
            )}
            <span className="text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-full font-semibold capitalize backdrop-blur-sm">
              {cat.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{cat.location}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {cat.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs glass-subtle px-2.5 py-1 rounded-full font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {cat.lastSeen}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            {cat.followers}
          </span>
        </div>
      </div>
    </button>
  )
}
