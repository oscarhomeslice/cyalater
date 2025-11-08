"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Euro,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Home,
  Sun,
  Heart,
  Zap,
  Mountain,
  Check,
} from "lucide-react"

export interface ActivityData {
  id: string
  title: string
  description: string
  tags: string[]
  cost: number
  currency: string
  duration: string
  activityLevel: "Low" | "Moderate" | "High"
  locationType: "Indoor" | "Outdoor" | "Both"
  specialFeature: string
  details?: string
}

interface ActivityCardProps {
  activity: ActivityData
  onAddToShortlist?: (id: string) => void
  isShortlisted?: boolean // Added prop to track shortlist state
}

const tagColors: Record<string, string> = {
  Outdoor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Creative: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Team Building": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Adventure: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Relaxing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Food: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Cultural: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Active: "bg-red-500/20 text-red-400 border-red-500/30",
  Social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
}

const activityLevelConfig = {
  Low: { icon: Heart, color: "text-emerald-400" },
  Moderate: { icon: Zap, color: "text-yellow-400" },
  High: { icon: Mountain, color: "text-red-400" },
}

export function ActivityCard({ activity, onAddToShortlist, isShortlisted = false }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  const ActivityLevelIcon = activityLevelConfig[activity.activityLevel].icon

  const handleShortlist = () => {
    if (!isShortlisted) {
      setShowCheckmark(true)
      setTimeout(() => setShowCheckmark(false), 1000)
    }
    onAddToShortlist?.(activity.id)
  }

  return (
    <article
      className="group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-zinc-700 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-black"
      aria-label={`${activity.title} activity`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-white leading-tight flex-1">{activity.title}</h3>
        <Badge
          variant="outline"
          className={`${
            activity.locationType === "Outdoor"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : activity.locationType === "Indoor"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "bg-purple-500/20 text-purple-400 border-purple-500/30"
          } flex items-center gap-1 shrink-0`}
          aria-label={`${activity.locationType} activity`}
        >
          {activity.locationType === "Outdoor" ? (
            <Sun className="w-3 h-3" aria-hidden="true" />
          ) : (
            <Home className="w-3 h-3" aria-hidden="true" />
          )}
          {activity.locationType}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-zinc-400 leading-relaxed mb-4">{activity.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Activity tags">
        {activity.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`${tagColors[tag] || "bg-zinc-700/50 text-zinc-300 border-zinc-600"} text-xs`}
            role="listitem"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-zinc-800">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-primary mb-1">
            <Euro className="w-4 h-4" aria-hidden="true" />
            <span className="font-bold text-lg">{activity.cost}</span>
          </div>
          <span className="text-xs text-zinc-500">per person</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-primary mb-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span className="font-bold text-lg">{activity.duration}</span>
          </div>
          <span className="text-xs text-zinc-500">duration</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={`flex items-center gap-1 mb-1 ${activityLevelConfig[activity.activityLevel].color}`}>
            <ActivityLevelIcon className="w-4 h-4" aria-hidden="true" />
            <span className="font-bold text-lg">{activity.activityLevel}</span>
          </div>
          <span className="text-xs text-zinc-500">intensity</span>
        </div>
      </div>

      {/* Special Feature */}
      <div className="bg-gradient-to-r from-primary/10 to-emerald-400/10 border border-primary/20 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-primary mb-1">What makes it special</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{activity.specialFeature}</p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {activity.details && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors duration-200 w-full focus:outline-none focus:text-primary"
            aria-expanded={isExpanded}
            aria-controls={`details-${activity.id}`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="font-medium">Learn More</span>
          </button>
          {isExpanded && (
            <div
              id={`details-${activity.id}`}
              className="mt-3 pl-6 text-sm text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300"
            >
              {activity.details}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleShortlist}
        variant="outline"
        className={`w-full relative overflow-hidden ${
          isShortlisted
            ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
            : "bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800 hover:border-primary/50"
        } transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900`}
        aria-label={isShortlisted ? `Remove ${activity.title} from shortlist` : `Add ${activity.title} to shortlist`}
        aria-pressed={isShortlisted}
      >
        {showCheckmark && (
          <div
            className="absolute inset-0 bg-primary/30 flex items-center justify-center animate-in fade-in zoom-in duration-300"
            aria-hidden="true"
          >
            <Check className="w-8 h-8 text-primary animate-in zoom-in duration-200" />
          </div>
        )}
        <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
        {isShortlisted ? "Added to Shortlist" : "Add to Shortlist"}
      </Button>
    </article>
  )
}
