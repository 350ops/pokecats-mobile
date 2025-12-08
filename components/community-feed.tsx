"use client"

import { Heart, MapPin, Camera, TrendingUp, Award } from "lucide-react"

interface ActivityItem {
  id: number
  user: string
  action: string
  cat: string
  time: string
  type: "sighting" | "feeding" | "photo" | "follow"
}

interface LeaderboardUser {
  rank: number
  name: string
  score: number
  badge: string
}

export default function CommunityFeed() {
  const activities: ActivityItem[] = [
    { id: 1, user: "Sarah M.", action: "spotted", cat: "Luna", time: "1h ago", type: "sighting" },
    { id: 2, user: "John D.", action: "fed", cat: "Shadow", time: "2h ago", type: "feeding" },
    { id: 3, user: "Emma T.", action: "shared 3 photos of", cat: "Whiskers", time: "3h ago", type: "photo" },
    { id: 4, user: "You", action: "started following", cat: "Luna", time: "5h ago", type: "follow" },
  ]

  const leaderboard: LeaderboardUser[] = [
    { rank: 1, name: "Sarah M.", score: 342, badge: "🏆" },
    { rank: 2, name: "John D.", score: 298, badge: "🥈" },
    { rank: 3, name: "Emma T.", score: 276, badge: "🥉" },
    { rank: 4, name: "You", score: 189, badge: "" },
  ]

  return (
    <div className="space-y-5 pb-8 pt-4">
      <div className="mx-4">
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/20 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wider">This Week's Challenge</p>
                <h3 className="font-bold text-lg text-foreground mt-1">Photograph a Shy Cat</h3>
              </div>
              <span className="text-3xl">📸</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <TrendingUp className="w-4 h-4" />
              412 people participating
            </div>
            <button className="w-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition-all glow-accent">
              Join Challenge
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4">
        {[
          { value: "12", label: "Sightings" },
          { value: "24", label: "Feedings" },
          { value: "8", label: "Followed" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 text-center liquid-card">
            <p className="text-2xl font-bold text-gradient">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Top Spotters
          </h3>
          <button className="text-xs text-primary font-semibold">View All</button>
        </div>
        <div className="glass rounded-3xl overflow-hidden">
          {leaderboard.map((user, idx) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between px-4 py-4 ${idx !== leaderboard.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-8 text-center">
                  {user.badge || <span className="text-muted-foreground">#{user.rank}</span>}
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.score} points</p>
                </div>
              </div>
              <div className="glass-subtle px-3 py-1.5 rounded-full">
                <p className="font-bold text-sm text-foreground">{user.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4">
        <h3 className="font-bold text-foreground mb-3">Community Activity</h3>
        <div className="space-y-3">
          {activities.map((activity) => {
            const icons = {
              sighting: <MapPin className="w-4 h-4" />,
              feeding: <Heart className="w-4 h-4" />,
              photo: <Camera className="w-4 h-4" />,
              follow: <Heart className="w-4 h-4" />,
            }

            return (
              <div key={activity.id} className="glass rounded-2xl p-4 flex items-start gap-3 liquid-card">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  {icons[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                    <span className="font-semibold text-primary">{activity.cat}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
