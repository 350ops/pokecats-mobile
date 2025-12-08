"use client"

import { X, AlertCircle, MapPin, Camera } from "lucide-react"
import { useState } from "react"

interface ReportCatModalProps {
  onClose: () => void
}

export default function ReportCatModal({ onClose }: ReportCatModalProps) {
  const [urgency, setUrgency] = useState("moderate")
  const [description, setDescription] = useState("")

  const urgencyLevels = [
    { value: "low", label: "Not Urgent", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end safe-area-inset-bottom">
      <div className="w-full bg-card rounded-t-3xl p-6 animate-in slide-in-from-bottom max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Report Cat Needs Help
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Urgency Level */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Urgency Level</p>
            <div className="grid grid-cols-3 gap-2">
              {urgencyLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setUrgency(level.value)}
                  className={`p-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                    urgency === level.value
                      ? `${level.color} border-current`
                      : "bg-muted text-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Location</p>
            <button className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">San Francisco, CA</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Description</p>
            <textarea
              placeholder="Describe the cat's condition (injuries, illness, behavior)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm resize-none h-24"
            />
          </div>

          {/* Photo Upload */}
          <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg hover:bg-muted transition-colors">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add photo (optional)</span>
          </button>

          {/* Contact Info */}
          <input
            type="tel"
            placeholder="Contact number (optional)"
            className="w-full px-3 py-2 bg-input border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-foreground rounded-xl py-3 font-semibold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )
}
