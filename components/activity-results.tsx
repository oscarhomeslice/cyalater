"use client"

import { useState } from "react"
import { ActivityCard, type ActivityData } from "./activity-card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ChevronDown, ChevronUp, Users, Sparkles, Lightbulb, CloudRain, Clock, Wallet } from "lucide-react"
import type { ActivityRecommendation, ParsedQuery } from "@/lib/types"

interface ActivityResultsProps {
  results: {
    recommendations: ActivityRecommendation
    query: ParsedQuery
  }
  onNewSearch: () => void
  onAddToShortlist?: (id: string) => void
  shortlistedIds?: string[]
}

export function ActivityResults({ results, onNewSearch, onAddToShortlist, shortlistedIds = [] }: ActivityResultsProps) {
  const [showProTips, setShowProTips] = useState(false)
  const { recommendations, query } = results

  const transformedActivities: ActivityData[] = recommendations.activities.map((activity, index) => ({
    id: activity.id || `activity-${index}`,
    name: activity.name,
    title: activity.name,
    description: activity.experience,
    tags: activity.tags || [],
    cost: Number.parseFloat(activity.cost) || 0,
    currency: query.currency || "EUR",
    duration: activity.duration,
    activityLevel: (activity.activityLevel?.toLowerCase() === "low"
      ? "Low"
      : activity.activityLevel?.toLowerCase() === "moderate"
        ? "Moderate"
        : "High") as "Low" | "Moderate" | "High",
    locationType: (activity.locationType === "indoor"
      ? "Indoor"
      : activity.locationType === "outdoor"
        ? "Outdoor"
        : "Both") as "Indoor" | "Outdoor" | "Both",
    specialFeature: activity.specialElement || activity.bestFor,
    details: activity.preparation,
    tripAdvisorRating: activity.rating,
    reviewCount: activity.reviewCount,
    tripAdvisorUrl: activity.tripAdvisorUrl,
  }))

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Badge
          variant="outline"
          className="bg-primary/10 border-primary/30 text-primary px-4 py-2 text-sm font-medium flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span>
            Activities for {query.group_size} {query.location ? `in ${query.location}` : ""}
          </span>
        </Badge>

        <Button
          onClick={onNewSearch}
          variant="outline"
          className="border-zinc-700 hover:border-primary/50 bg-transparent"
        >
          New Search
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Your Personalized Activities
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {transformedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onAddToShortlist={onAddToShortlist}
              isShortlisted={shortlistedIds.includes(activity.id)}
            />
          ))}
        </div>
      </div>

      {recommendations.backupOptions && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-400" />
            Backup Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.backupOptions.weatherAlternative && (
              <div className="border-2 border-dashed border-blue-500/30 rounded-xl p-4 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <h4 className="font-semibold text-blue-400">Weather Alternative</h4>
                </div>
                <p className="text-sm text-zinc-400">{recommendations.backupOptions.weatherAlternative}</p>
              </div>
            )}

            {recommendations.backupOptions.timeSaver && (
              <div className="border-2 border-dashed border-amber-500/30 rounded-xl p-4 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="font-semibold text-amber-400">Time Saver</h4>
                </div>
                <p className="text-sm text-zinc-400">{recommendations.backupOptions.timeSaver}</p>
              </div>
            )}

            {recommendations.backupOptions.budgetFriendly && (
              <div className="border-2 border-dashed border-emerald-500/30 rounded-xl p-4 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-emerald-400">Budget-Friendly</h4>
                </div>
                <p className="text-sm text-zinc-400">{recommendations.backupOptions.budgetFriendly}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {recommendations.proTips && recommendations.proTips.length > 0 && (
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <button
            onClick={() => setShowProTips(!showProTips)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold">Pro Tips</h3>
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                {recommendations.proTips.length}
              </Badge>
            </div>
            {showProTips ? (
              <ChevronUp className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
            )}
          </button>

          {showProTips && (
            <ul className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {recommendations.proTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-zinc-300">
                  <span className="text-xl shrink-0" role="img" aria-label="lightbulb">
                    💡
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {recommendations.refinementPrompts && recommendations.refinementPrompts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-400">Refine your search:</h3>
          <div className="flex flex-wrap gap-2">
            {recommendations.refinementPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:border-primary/50 hover:bg-primary/10 transition-all bg-transparent"
                onClick={() => {
                  // This would trigger a new search with the refinement prompt
                  console.log("[v0] Refinement prompt clicked:", prompt)
                }}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-8 border-t border-zinc-800">
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <span>Activity data provided by</span>
          <a
            href="https://www.tripadvisor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl" role="img" aria-label="TripAdvisor">
              🦉
            </span>
            <span className="font-semibold" style={{ color: "#34E0A1" }}>
              TripAdvisor
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
