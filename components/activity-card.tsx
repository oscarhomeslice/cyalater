"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Euro,
  Sparkles,
  ActivityIcon,
  Home,
  Sun,
  Heart,
  Zap,
  Mountain,
  Check,
  ExternalLink,
  Star,
  Users,
  Lightbulb,
} from "lucide-react"

export interface ActivityData {
  id?: string
  name: string
  experience: string
  bestFor: string // New field
  cost: string
  duration: string
  locationType: "indoor" | "outdoor" | "hybrid"
  activityLevel: "low" | "moderate" | "high"
  specialElement: string
  preparation: string
  amadeusUrl?: string
  amadeusId?: string
  rating?: number
  reviewCount?: number
  image?: string
  tags?: string[]
}

interface ActivityCardProps {
  activity: ActivityData
  onAddToShortlist?: (id: string) => void
  isShortlisted?: boolean
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
  Indoor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Hybrid: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const activityLevelConfig = {
  low: { icon: Heart, color: "text-emerald-400", label: "Low" },
  moderate: { icon: Zap, color: "text-yellow-400", label: "Moderate" },
  high: { icon: Mountain, color: "text-red-400", label: "High" },
}

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const stars = []

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className="w-3 h-3 fill-[#00AA6C] text-[#00AA6C] dark:fill-[#84E9BD] dark:text-[#84E9BD]"
      />,
    )
  }

  if (hasHalfStar) {
    stars.push(
      <Star
        key="half"
        className="w-3 h-3 fill-[#00AA6C] text-[#00AA6C] dark:fill-[#84E9BD] dark:text-[#84E9BD] opacity-50"
      />,
    )
  }

  return stars
}

export function ActivityCard({ activity, onAddToShortlist, isShortlisted = false }: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  if (!activity) return null

  const activityName = activity.name || "Activity"
  const ActivityLevelIcon = activity?.activityLevel ? activityLevelConfig[activity.activityLevel]?.icon : Heart

  const handleShortlist = () => {
    if (!isShortlisted) {
      setShowCheckmark(true)
      setTimeout(() => setShowCheckmark(false), 1000)
    }
    onAddToShortlist?.(activity.id || activityName)
  }

  return (
    <article
      className="group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-zinc-700 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-black"
      aria-label={`${activityName} activity`}
    >
      {activity?.image && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={activity.image || "/placeholder.svg"}
            alt={activityName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.parentElement?.classList.add("hidden")
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight flex-1">{activityName}</h3>
          <Badge
            variant="outline"
            className={`${
              activity?.locationType === "outdoor"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : activity?.locationType === "indoor"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-purple-500/20 text-purple-400 border-purple-500/30"
            } flex items-center gap-1 shrink-0`}
            aria-label={`${activity?.locationType || "hybrid"} activity`}
          >
            {activity?.locationType === "outdoor" ? (
              <Sun className="w-3 h-3" aria-hidden="true" />
            ) : (
              <Home className="w-3 h-3" aria-hidden="true" />
            )}
            {activity?.locationType
              ? activity.locationType.charAt(0).toUpperCase() + activity.locationType.slice(1)
              : "Hybrid"}
          </Badge>
        </div>

        {/* Experience Description */}
        <p className="text-zinc-400 leading-relaxed mb-4">{activity.experience}</p>

        {activity?.rating && activity.rating > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" role="img" aria-label="Amadeus" aria-hidden="true">
                ✈️
              </span>
              <span className="text-xs font-semibold" style={{ color: "#34E0A1" }}>
                Amadeus
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">{renderStars(activity.rating)}</div>
              <span className="text-sm font-semibold text-white">{activity.rating.toFixed(1)}</span>
              {activity?.reviewCount && (
                <span className="text-xs text-zinc-400">({activity.reviewCount.toLocaleString()} reviews)</span>
              )}
            </div>
          </div>
        )}

        {activity.bestFor && (
          <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-purple-300 mb-1">Best for:</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{activity.bestFor}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {activity?.tags && activity.tags.length > 0 && (
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
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-zinc-800">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-primary mb-1">
              <Euro className="w-4 h-4" aria-hidden="true" />
              <span className="font-bold text-lg">{activity.cost || "TBD"}</span>
            </div>
            <span className="text-xs text-zinc-500">per person</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-primary mb-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="font-bold text-lg">{activity.duration || "TBD"}</span>
            </div>
            <span className="text-xs text-zinc-500">duration</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div
              className={`flex items-center gap-1 mb-1 ${activity?.activityLevel ? activityLevelConfig[activity.activityLevel]?.color : "text-zinc-400"}`}
            >
              {ActivityLevelIcon && <ActivityLevelIcon className="w-4 h-4" aria-hidden="true" />}
              <span className="font-bold text-lg">
                {activity?.activityLevel ? activityLevelConfig[activity.activityLevel]?.label : "Low"}
              </span>
            </div>
            <span className="text-xs text-zinc-500">intensity</span>
          </div>
        </div>

        {activity.specialElement && (
          <div className="bg-gradient-to-r from-primary/10 to-emerald-400/10 border border-primary/20 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">What makes it special</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{activity.specialElement}</p>
              </div>
            </div>
          </div>
        )}

        {activity.preparation && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-amber-300 mb-1">Preparation needed:</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{activity.preparation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleShortlist}
            variant="outline"
            className={`flex-1 relative overflow-hidden ${
              isShortlisted
                ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
                : "bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800 hover:border-primary/50"
            } transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900`}
            aria-label={isShortlisted ? `Remove ${activityName} from shortlist` : `Add ${activityName} to shortlist`}
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
            <ActivityIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            {isShortlisted ? "Added" : "Add to Shortlist"}
          </Button>

          {activity?.amadeusUrl && (
            <Button
              onClick={() => window.open(activity.amadeusUrl, "_blank", "noopener,noreferrer")}
              variant="outline"
              className="bg-zinc-800/50 border-zinc-700 text-white hover:bg-primary/20 hover:border-primary transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
              aria-label={`Book ${activityName} activity`}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Amadeus attribution footer */}
        {activity?.amadeusUrl && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-center gap-2">
            <span className="text-[11px] text-zinc-600">Powered by</span>
            <a
              href="https://www.amadeus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              aria-label="Amadeus"
            >
              <span className="text-lg" role="img" aria-hidden="true">
                ✈️
              </span>
              <span className="text-[11px] font-semibold text-primary">Amadeus</span>
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
