"use client"

import { MapPin, Users, Heart, Plus, User } from "lucide-react"

interface NavigationBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddCat: () => void
}

export default function NavigationBar({ activeTab, onTabChange, onAddCat }: NavigationBarProps) {
  const tabs = [
    { id: "map", label: "Map", icon: MapPin },
    { id: "directory", label: "Cats", icon: Heart },
    { id: "community", label: "Community", icon: Users },
    { id: "profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom z-40">
      <div className="h-4" />

      <div className="glass mx-4 mb-5 rounded-[1.75rem] overflow-hidden">
        <div className="flex items-center justify-around h-[4.5rem] px-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 py-2 transition-all duration-300 rounded-2xl mx-1 ${
                activeTab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === id && <div className="absolute inset-0 bg-primary/10 rounded-2xl" />}
              <Icon
                className={`w-6 h-6 relative z-10 transition-transform duration-300 ${activeTab === id ? "scale-110" : ""}`}
              />
              <span className="text-xs font-medium relative z-10">{label}</span>
              {activeTab === id && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-6 pill-indicator rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAddCat}
        className="absolute -top-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-300 active:scale-95 glow-primary"
      >
        <Plus className="w-7 h-7" />
      </button>
    </nav>
  )
}
