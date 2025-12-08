"use client"

import { X, Heart, MessageCircle, Camera, Utensils } from "lucide-react"
import { useState } from "react"

interface CatModalProps {
  cat: {
    id: number
    name: string
    image: string
    location: string
    status: string
    tags: string[]
    lastSeen: string
    followers: number
  }
  onClose: () => void
}

export default function CatModal({ cat, onClose }: CatModalProps) {
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 flex items-end" onClick={onClose}>
      <div
        className="w-full glass-solid rounded-t-[2rem] overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center pt-3 pb-2 border-b border-border/50 sticky top-0 glass-solid z-10">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-3" />
          <div className="flex items-center justify-between w-full px-5">
            <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
            <button onClick={onClose} className="glass-button p-2 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {/* Main Image */}
          <div className="relative h-64">
            <img src={cat.image || "/placeholder.svg"} alt={cat.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`absolute top-4 right-4 glass-subtle rounded-full p-3.5 transition-all duration-300 ${isFollowing ? "glow-accent" : ""}`}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${isFollowing ? "fill-accent text-accent" : "text-muted-foreground"}`}
              />
            </button>
          </div>

          {/* Info Section */}
          <div className="p-5 space-y-5">
            {/* Status and Location in glass cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-subtle rounded-2xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Status</p>
                <p className="text-sm font-semibold text-foreground capitalize">{cat.status}</p>
              </div>
              <div className="glass-subtle rounded-2xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Location</p>
                <p className="text-sm text-foreground truncate">{cat.location}</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs glass-subtle px-3.5 py-1.5 rounded-full font-medium text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button className="glass-button rounded-2xl py-4 flex flex-col items-center gap-2 hover:glow-accent">
                <Camera className="w-5 h-5 text-accent" />
                <span className="text-xs font-medium text-foreground">Photo</span>
              </button>
              <button className="glass-button rounded-2xl py-4 flex flex-col items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-foreground">Feed</span>
              </button>
              <button className="glass-button rounded-2xl py-4 flex flex-col items-center gap-2">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Note</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-subtle rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">Last Seen</p>
                <p className="font-semibold text-foreground">{cat.lastSeen}</p>
              </div>
              <div className="glass-subtle rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="font-semibold text-foreground">{cat.followers}</p>
              </div>
            </div>

            {/* Health Notes */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
                Recent Activity
              </p>
              <div className="glass-subtle rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-lg font-medium">Fed</span>
                  <span className="text-muted-foreground">by Sarah M. 2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xs bg-accent/20 text-accent px-2.5 py-1 rounded-lg font-medium">Spotted</span>
                  <span className="text-muted-foreground">by John D. 4 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
