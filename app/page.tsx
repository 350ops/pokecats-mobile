"use client"

import { useState } from "react"
import { Search, Settings } from "lucide-react"
import MapView from "@/components/map-view"
import CatCard from "@/components/cat-card"
import CatModal from "@/components/cat-modal"
import CatProfilePage from "@/components/cat-profile-page"
import NavigationBar from "@/components/navigation-bar"
import CommunityFeed from "@/components/community-feed"
import SearchBar from "@/components/search-bar"
import UserProfilePage from "@/components/user-profile-page"
import SettingsPage from "@/components/settings-page"

const SAMPLE_CATS = [
  {
    id: 1,
    name: "Luna",
    image: "/orange-tabby-cat.png",
    location: "Oak Street Park",
    status: "friendly",
    tags: ["friendly", "spotted"],
    lastSeen: "2 hours ago",
    followers: 24,
    distance: "120m",
    healthStatus: "healthy" as const,
    description: "A beautiful orange tabby who loves attention and treats. Very friendly with people!",
  },
  {
    id: 2,
    name: "Shadow",
    image: "/black-cat-portrait.png",
    location: "Downtown Alley",
    status: "shy",
    tags: ["shy", "needs care"],
    lastSeen: "5 hours ago",
    followers: 12,
    distance: "250m",
    healthStatus: "warning" as const,
    description: "A mysterious black cat who appears at dusk. Shy but warms up with patience.",
  },
  {
    id: 3,
    name: "Whiskers",
    image: "/white-gray-cat.jpg",
    location: "Community Garden",
    status: "healthy",
    tags: ["neutered", "healthy"],
    lastSeen: "Today",
    followers: 38,
    distance: "180m",
    healthStatus: "healthy" as const,
    description: "A gentle white and gray cat. Neutered and well-cared for by the community.",
  },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState("map")
  const [selectedCat, setSelectedCat] = useState<(typeof SAMPLE_CATS)[0] | null>(null)
  const [showAddCat, setShowAddCat] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCatProfile, setShowCatProfile] = useState(false)

  return (
    <main className="h-screen w-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <header className="relative z-30">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />
        <div className="glass-solid px-5 py-5 safe-area-inset-top relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gradient tracking-tight">Stray Cats</h1>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">Care for your neighborhood cats</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(true)} className="glass-button p-3 rounded-2xl">
                <Search className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={() => setShowSettings(true)} className="glass-button p-3 rounded-2xl">
                <Settings className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col pb-28">
        {activeTab === "map" && (
          <div className="flex-1 flex flex-col">
            <MapView
              cats={SAMPLE_CATS}
              onSelectCat={(cat) => {
                setSelectedCat(cat)
                setShowCatProfile(true)
              }}
            />
          </div>
        )}

        {activeTab === "directory" && (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Nearby Cats</h2>
            <div className="space-y-4 pb-8">
              {SAMPLE_CATS.map((cat) => (
                <CatCard
                  key={cat.id}
                  cat={cat}
                  onClick={() => {
                    setSelectedCat(cat)
                    setShowCatProfile(true)
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="flex-1 overflow-y-auto px-0 py-0">
            <CommunityFeed />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex-1 overflow-y-auto">
            <UserProfilePage onClose={() => setActiveTab("map")} />
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} onAddCat={() => setShowAddCat(true)} />

      {/* Modals */}
      {showCatProfile && selectedCat && <CatProfilePage cat={selectedCat} onClose={() => setShowCatProfile(false)} />}

      {selectedCat && !showCatProfile && <CatModal cat={selectedCat} onClose={() => setSelectedCat(null)} />}

      {showAddCat && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 flex items-end"
          onClick={() => setShowAddCat(false)}
        >
          <div
            className="w-full glass-solid rounded-t-[2rem] p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold mb-5 text-foreground">Add a Cat</h2>
            <div className="space-y-3 mb-5">
              <button className="w-full glass-button rounded-2xl py-4 font-semibold text-foreground flex items-center justify-center gap-3 glow-primary">
                <span className="text-lg">📸</span> Take Photo
              </button>
              <button className="w-full glass-button rounded-2xl py-4 font-semibold text-foreground flex items-center justify-center gap-3">
                <span className="text-lg">📱</span> Choose from Library
              </button>
            </div>
            <button
              onClick={() => setShowAddCat(false)}
              className="w-full text-center py-3 text-muted-foreground font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </main>
  )
}
