"use client"

import { useState } from "react"
import { ArrowLeft, Heart, MapPin, Share2, Upload, Calendar, Pill, MessageSquare } from "lucide-react"

interface CatProfilePageProps {
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
    description?: string
  }
  onClose: () => void
}

export default function CatProfilePage({ cat, onClose }: CatProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [gallery] = useState([
    { id: 1, image: cat.image, date: "Today" },
    { id: 2, image: "/orange-tabby-cat.png", date: "2 days ago" },
    { id: 3, image: "/white-gray-cat.jpg", date: "1 week ago" },
  ])

  const sightings = [
    { date: "Today, 2:30 PM", location: "Oak Street Park", reporter: "You" },
    { date: "Yesterday, 6:15 PM", location: "Oak Street Park", reporter: "Sarah M." },
    { date: "2 days ago, 4:00 PM", location: "Community Garden", reporter: "John D." },
  ]

  const feedingLog = [
    { date: "Today, 9:00 AM", amount: "Fish and rice", by: "You" },
    { date: "Yesterday, 5:45 PM", amount: "Dry kibble", by: "Sarah M." },
    { date: "2 days ago, 8:30 AM", amount: "Wet food", by: "You" },
  ]

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 overflow-y-auto safe-area-inset">
      <div className="min-h-screen bg-background/95 backdrop-blur-xl flex flex-col">
        <div className="sticky top-0 z-40 glass-solid flex items-center justify-between px-4 py-4">
          <button onClick={onClose} className="glass-button p-2.5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1 text-center text-foreground">{cat.name}</h1>
          <button className="glass-button p-2.5 rounded-xl">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Image */}
          <div className="relative h-72">
            <img src={cat.image || "/placeholder.svg"} alt={cat.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`absolute bottom-6 right-6 glass-subtle rounded-full p-4 transition-all duration-300 ${isFollowing ? "glow-accent" : ""}`}
            >
              <Heart className={`w-6 h-6 ${isFollowing ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* Cat Info */}
          <div className="px-4 -mt-8 relative z-10">
            <div className="glass rounded-3xl p-5 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{cat.name}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4" />
                    {cat.location}
                  </p>
                </div>
                <div className="text-right glass-subtle rounded-2xl px-4 py-2">
                  <p className="text-lg font-bold text-foreground">{cat.followers}</p>
                  <p className="text-xs text-muted-foreground">followers</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {cat.tags.map((tag) => (
                  <span key={tag} className="text-xs glass-subtle px-3 py-1.5 rounded-full font-medium text-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {cat.description && <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>}
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="px-4 mb-4">
            <h3 className="font-semibold text-foreground mb-3 px-1">Photo Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((photo) => (
                <button key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden glass group">
                  <img src={photo.image || "/placeholder.svg"} alt="Cat" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs text-center font-medium">{photo.date}</p>
                  </div>
                </button>
              ))}
            </div>
            <button className="w-full mt-3 glass rounded-2xl py-4 text-center hover:bg-muted/30 transition-colors">
              <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Add photo</p>
            </button>
          </div>

          {/* Recent Sightings */}
          <div className="px-4 mb-4">
            <h3 className="font-semibold text-foreground mb-3 px-1">Recent Sightings</h3>
            <div className="glass rounded-3xl overflow-hidden">
              {sightings.map((sighting, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 p-4 ${idx !== sightings.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{sighting.location}</p>
                    <p className="text-xs text-muted-foreground">{sighting.date}</p>
                  </div>
                  <span className="text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-full font-medium self-center">
                    {sighting.reporter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feeding Log */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Feeding Log
              </h3>
              <button className="text-xs text-primary font-semibold">Add feeding</button>
            </div>
            <div className="glass rounded-3xl overflow-hidden">
              {feedingLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 p-4 ${idx !== feedingLog.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{log.amount}</p>
                    <p className="text-xs text-muted-foreground">{log.date}</p>
                  </div>
                  <span className="text-xs text-muted-foreground self-center">{log.by}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Notes */}
          <div className="px-4 mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 px-1">
              <Pill className="w-4 h-4 text-primary" />
              Health Notes
            </h3>
            <div className="space-y-2">
              <div className="glass rounded-2xl p-4 border-l-4 border-green-400">
                <p className="text-sm text-foreground">Neutered - November 2023</p>
              </div>
              <div className="glass rounded-2xl p-4 border-l-4 border-primary">
                <p className="text-sm text-foreground">Last vet visit - 3 months ago</p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-4 pb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Community Comments
              </h3>
              <span className="glass-subtle px-2.5 py-1 rounded-full text-xs text-muted-foreground">12</span>
            </div>
            <div className="glass rounded-3xl overflow-hidden mb-3">
              {[
                { user: "Sarah M.", text: "Such a sweet cat! I feed her daily.", time: "1h ago" },
                { user: "John D.", text: "Has anyone seen her kitten?", time: "3h ago" },
              ].map((comment, idx) => (
                <div key={idx} className={`p-4 ${idx !== 1 ? "border-b border-border/30" : ""}`}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm text-foreground">{comment.user}</p>
                    <p className="text-xs text-muted-foreground">{comment.time}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full px-4 py-3.5 glass rounded-2xl text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
