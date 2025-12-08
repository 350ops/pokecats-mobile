"use client"

import { MapPin, Navigation2 } from "lucide-react"
import { useEffect, useRef } from "react"

interface Cat {
  id: number
  name: string
  image: string
  location: string
  status: string
}

interface MapViewProps {
  cats: Cat[]
  onSelectCat: (cat: Cat) => void
}

export default function MapView({ cats, onSelectCat }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    script.async = true

    script.onload = () => {
      // @ts-ignore
      const L = window.L
      if (!L) return

      const map = L.map(mapContainer.current).setView([37.7749, -122.4194], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      const catPositions = [
        { lat: 37.7749, lng: -122.4194, name: "Luna", status: "friendly" },
        { lat: 37.7849, lng: -122.4094, name: "Shadow", status: "shy" },
        { lat: 37.7649, lng: -122.4294, name: "Whiskers", status: "healthy" },
      ]

      catPositions.forEach((cat, idx) => {
        const marker = L.marker([cat.lat, cat.lng], {
          icon: L.divIcon({
            html: `<div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-sm shadow-xl transform hover:scale-110 transition-all cursor-pointer border-2 border-white/50" style="box-shadow: 0 0 20px rgba(99, 102, 241, 0.4)">
              ${cat.name.charAt(0)}
            </div>`,
            iconSize: [48, 48],
            className: "cat-marker",
          }),
        })

        marker.on("click", () => {
          onSelectCat(cats[idx])
        })

        marker.bindPopup(
          `<div class="text-center font-semibold">${cat.name}</div><div class="text-xs text-gray-500 capitalize">${cat.status}</div>`,
        )

        marker.addTo(map)
      })
    }

    document.body.appendChild(script)

    return () => {
      const linkElement = document.querySelector("link[href*='leaflet.min.css']")
      if (linkElement) linkElement.remove()
    }
  }, [cats, onSelectCat])

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-primary/5 to-accent/5 overflow-hidden">
      <div ref={mapContainer} className="flex-1 w-full h-full" />

      <div className="glass mx-4 mb-6 p-5 rounded-3xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground">Your Location</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4" />
              San Francisco, CA
            </p>
          </div>
          <button className="glass-button rounded-full p-3 glow-primary">
            <Navigation2 className="w-5 h-5 text-primary" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{cats.length} cats spotted nearby. Tap to view details.</p>
      </div>
    </div>
  )
}
