"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Euro,
  Heart,
  Zap,
  Mountain,
  Check,
  ExternalLink,
  Star,
  Users,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
  Wrench,
  Ticket,
  Package,
} from "lucide-react"

export interface ActivityData {
  id?: string
  name: string
  experience: string
  description?: string
  bestFor: string
  cost: string | number
  duration: string
  locationType: "indoor" | "outdoor" | "hybrid"
  activityLevel: "low" | "moderate" | "high"
  specialElement: string
  preparation: string
  tripAdvisorUrl?: string
  tripAdvisorId?: string
  viatorUrl?: string // Added viatorUrl for bookable activities
  rating?: number
  reviewCount?: number
  image?: string
  tags?: string[]
  isInspiration?: boolean
}

interface ActivityCardProps {
  activity: ActivityData
  onAddToShortlist?: (id: string) => void
  isShortlisted?: boolean
  isBookable?: boolean // Added isBookable prop to distinguish real vs AI activities
  categoryType?: "diy" | "experience" // Added categoryType prop to display DIY vs Experience badge
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

export function ActivityCard({
  activity,
  onAddToShortlist,
  isShortlisted = false,
  isBookable = false,
  categoryType,
}: ActivityCardProps) {
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    bestFor: false,
    specialElement: false,
    preparation: false,
  })

  console.log("[v0] ActivityCard received activity:", activity)

  if (!activity) return null

  const activityName = activity.name || "Activity"
  const ActivityLevelIcon = activity?.activityLevel ? activityLevelConfig[activity.activityLevel]?.icon : Heart

  const costDisplay =
    typeof activity.cost === "number"
      ? `${activity.cost}`
      : typeof activity.cost === "string" && activity.cost.includes("€")
        ? activity.cost.replace("€", "")
        : activity.cost || "TBD"

  const costLabel = categoryType === "experience" ? "est. per person" : "per person"

  const handleShortlist = () => {
    if (!isShortlisted) {
      setShowCheckmark(true)
      setTimeout(() => setShowCheckmark(false), 1000)
    }
    onAddToShortlist?.(activity.id || activityName)
  }

  const toggleSection = (section: "bestFor" | "specialElement" | "preparation") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const hasRating = activity?.rating && activity.rating > 0

  return (
    <article
      className={`group bg-zinc-900/50 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-black ${
        isBookable
          ? "border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
          : "border-zinc-800 hover:border-zinc-700 hover:shadow-primary/10 hover:-translate-y-1"
      }`}
      aria-label={`${activityName} activity`}
    >
      {activity?.image && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={activity.image || "/placeholder.svg"}
            alt={activityName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.parentElement?.classList.add("hidden")
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />

          {!isBookable && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                Inspiration
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {categoryType && (
          <div className="mb-3">
            <Badge
              variant="outline"
              className={
                categoryType === "diy"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-purple-500/20 text-purple-400 border-purple-500/30"
              }
            >
              {categoryType === "diy" ? (
                <>
                  <Wrench className="w-3 h-3 mr-1" />
                  DIY
                </>
              ) : (
                <>
                  <Ticket className="w-3 h-3 mr-1" />
                  Find Experience
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Header */}
        {isBookable && activity.viatorUrl ? (
          <a href={activity.viatorUrl} target="_blank" rel="noopener noreferrer" className="block mb-4 group/title">
            <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2 group-hover/title:text-emerald-400 transition-colors flex items-center gap-2">
              {activityName}
              <ExternalLink className="w-5 h-5 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </h3>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span className="capitalize">{activity.locationType}</span>
            </div>
          </a>
        ) : (
          <div className="mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2">{activityName}</h3>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span className="capitalize">{activity.locationType}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-zinc-300 leading-relaxed">
            {activity.experience || activity.description || "Experience description coming soon"}
          </p>
        </div>

        {hasRating && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              isBookable
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-purple-500/10 border border-purple-500/20"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">{renderStars(activity.rating)}</div>
              <span className="font-semibold">{activity.rating.toFixed(1)}</span>
              {activity?.reviewCount && (
                <span className="text-sm text-zinc-400">({activity.reviewCount.toLocaleString()} reviews)</span>
              )}
            </div>
          </div>
        )}

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

        <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-zinc-800">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-primary mb-1">
              <Euro className="w-4 h-4" aria-hidden="true" />
              <span className="font-bold text-lg">{costDisplay}</span>
            </div>
            <span className="text-xs text-zinc-500">{costLabel}</span>
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
              <span className="font-bold text-lg capitalize">
                {activity?.activityLevel ? activityLevelConfig[activity.activityLevel]?.label : "Low"}
              </span>
            </div>
            <span className="text-xs text-zinc-500">intensity</span>
          </div>
        </div>

        {!isBookable && categoryType === "diy" && activity.preparation && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection("preparation")}
              className="w-full p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-amber-300">Materials You'll Need</span>
                </div>
                {expandedSections.preparation ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </button>
            {expandedSections.preparation && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 animate-in slide-in-from-top-2 duration-200">
                {activity.preparation ? (
                  activity.preparation.includes("•") || activity.preparation.includes(",") ? (
                    <ul className="space-y-2">
                      {activity.preparation
                        .split(/[•,]/)
                        .map((item) => item.trim())
                        .filter((item) => item.length > 0)
                        .map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-zinc-200">
                            <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-200 leading-relaxed">{activity.preparation}</p>
                  )
                ) : (
                  <p className="text-sm text-zinc-400 italic">No materials specified</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-3">
          <button
            onClick={() => toggleSection("bestFor")}
            className="w-full p-3 rounded-lg bg-gradient-to-br from-purple-500/10 via-emerald-400/10 to-cyan-400/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-purple-300">Perfect for</span>
              </div>
              {expandedSections.bestFor ? (
                <ChevronUp className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              )}
            </div>
          </button>
          {expandedSections.bestFor && (
            <div className="mt-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-zinc-200 leading-relaxed">{activity.bestFor}</p>
            </div>
          )}
        </div>

        <div className="mb-3">
          <button
            onClick={() => toggleSection("specialElement")}
            className="w-full p-3 rounded-lg bg-gradient-to-br from-primary/10 via-emerald-400/10 to-cyan-400/10 border border-primary/30 hover:border-primary/50 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-primary">What makes it special</span>
              </div>
              {expandedSections.specialElement ? (
                <ChevronUp className="w-4 h-4 text-primary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary" />
              )}
            </div>
          </button>
          {expandedSections.specialElement && (
            <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-zinc-200 leading-relaxed">{activity.specialElement}</p>
            </div>
          )}
        </div>

        {isBookable ? (
          // Bookable activities: Show "Book on Viator" button with attribution
          <div className="space-y-3">
            <a href={activity.viatorUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/20">
                <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                Book on Viator
              </Button>
            </a>

            {/* Viator Attribution */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              <span>Powered by</span>
              <span className="font-semibold text-emerald-400">Viator</span>
            </div>
          </div>
        ) : (
          // Inspiration activities: Show "Add to Shortlist" button
          <Button
            onClick={handleShortlist}
            variant="outline"
            className={`w-full relative overflow-hidden ${
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
            <Heart className="w-4 h-4 mr-2" aria-hidden="true" />
            {isShortlisted ? "Added to Shortlist" : "Add to Shortlist"}
          </Button>
        )}
      </div>
    </article>
  )
}
