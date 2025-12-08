"use client"

import { ArrowLeft, Bell, Globe, Lock, HelpCircle, Info } from "lucide-react"
import { useState } from "react"

interface SettingsPageProps {
  onClose: () => void
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const [notifications, setNotifications] = useState({
    sightings: true,
    feeding: true,
    newKittens: true,
    missing: false,
  })

  const toggleNotification = (key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 overflow-y-auto safe-area-inset">
      <div className="sticky top-0 z-40 glass-solid flex items-center gap-3 px-4 py-4">
        <button onClick={onClose} className="glass-button p-2.5 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Notifications */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 px-1">
            <Bell className="w-4 h-4 text-primary" />
            Notifications
          </h3>
          <div className="glass rounded-3xl p-1 space-y-1">
            {[
              { key: "sightings", label: "Cat Sightings", desc: "Get alerts when cats you follow are spotted" },
              { key: "feeding", label: "Feeding Reminders", desc: "Daily reminders to feed your neighborhood cats" },
              { key: "newKittens", label: "New Kittens", desc: "Alert when new kittens are added to your area" },
              { key: "missing", label: "Missing Cats", desc: "Get alerts for missing cat reports" },
            ].map((item, idx) => (
              <div
                key={item.key}
                className={`flex items-start justify-between gap-3 p-4 ${idx !== 3 ? "border-b border-border/30" : ""}`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 flex-shrink-0 ${
                    notifications[item.key as keyof typeof notifications]
                      ? "bg-gradient-to-r from-primary to-primary/80 glow-primary"
                      : "glass-subtle"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notifications[item.key as keyof typeof notifications] ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 px-1">
            <Globe className="w-4 h-4 text-primary" />
            Preferences
          </h3>
          <div className="glass rounded-3xl overflow-hidden">
            {[
              { label: "Language", value: "English" },
              { label: "Location", value: "Auto-detect" },
              { label: "Theme", value: "Light" },
            ].map((item, idx) => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${idx !== 2 ? "border-b border-border/30" : ""}`}
              >
                <span className="text-sm text-foreground font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 px-1">
            <Lock className="w-4 h-4 text-primary" />
            Privacy & Security
          </h3>
          <div className="glass rounded-3xl overflow-hidden">
            {["Change Password", "Privacy Policy", "Terms of Service"].map((item, idx) => (
              <button
                key={item}
                className={`w-full text-left p-4 hover:bg-muted/30 transition-colors ${idx !== 2 ? "border-b border-border/30" : ""}`}
              >
                <p className="text-sm font-medium text-foreground">{item}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Help & About */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 px-1">
            <HelpCircle className="w-4 h-4 text-primary" />
            Help & About
          </h3>
          <div className="glass rounded-3xl overflow-hidden">
            <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors border-b border-border/30">
              <p className="text-sm font-medium text-foreground">Help Center</p>
            </button>
            <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors border-b border-border/30">
              <p className="text-sm font-medium text-foreground">Report an Issue</p>
            </button>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">App Version</span>
              </div>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
