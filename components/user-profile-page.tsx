"use client"

import { ArrowLeft, Edit2, Share2, Award, Camera, Heart, MapPin } from "lucide-react"

interface UserProfilePageProps {
  onClose: () => void
}

export default function UserProfilePage({ onClose }: UserProfilePageProps) {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 overflow-y-auto safe-area-inset">
      <div className="sticky top-0 z-40 glass-solid flex items-center justify-between px-4 py-4">
        <button onClick={onClose} className="glass-button p-2.5 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center text-foreground">Profile</h1>
        <button className="glass-button p-2.5 rounded-xl">
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-md mx-auto">
        <div className="px-4 py-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-primary mx-auto mb-4 flex items-center justify-center text-5xl shadow-xl glow-primary">
            👤
          </div>
          <h2 className="text-2xl font-bold text-foreground">You</h2>
          <p className="text-sm text-muted-foreground mt-1">Animal lover & Cat community member</p>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-6">
          {[
            { label: "Sightings", value: "12", icon: MapPin },
            { label: "Photos", value: "34", icon: Camera },
            { label: "Followed", value: "8", icon: Heart },
            { label: "Score", value: "189", icon: Award },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="glass rounded-2xl p-3 text-center liquid-card">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                <p className="font-bold text-foreground text-sm">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="px-4 pb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 px-1">
            <Award className="w-4 h-4 text-primary" />
            Badges Earned
          </h3>
          <div className="glass rounded-3xl p-4">
            <div className="grid grid-cols-6 gap-2">
              {["🌟", "🔥", "📸", "❤️", "🎯", "🏆"].map((badge, idx) => (
                <div
                  key={idx}
                  className="glass-subtle aspect-square rounded-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          <h3 className="font-semibold text-foreground mb-3 px-1">Recent Activity</h3>
          <div className="glass rounded-3xl overflow-hidden">
            {[
              { action: "Spotted Luna", time: "Today", icon: "📍" },
              { action: "Fed Shadow", time: "Yesterday", icon: "🍖" },
              { action: "Added photo", time: "2 days ago", icon: "📸" },
            ].map((item, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-4 ${idx !== 2 ? "border-b border-border/30" : ""}`}>
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-8 space-y-3">
          <button className="w-full glass-button rounded-2xl py-4 text-foreground font-semibold flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Profile
          </button>
          <button className="w-full glass rounded-2xl py-4 text-foreground font-semibold">Settings</button>
        </div>
      </div>
    </div>
  )
}
