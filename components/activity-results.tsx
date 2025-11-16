"use client"

import { useState } from "react"
import { ActivityCard, type ActivityData } from "./activity-card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ChevronDown, ChevronUp, Sparkles, Lightbulb, Search } from 'lucide-react'
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
  console.log("[Results] Received results:", results)
  console.log("[Results] Has recommendations:", !!results?.recommendations)
  
  if (!results || !results.recommendations) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No results to display</p>
        <Button onClick={onNewSearch} className="mt-4" variant="outline">
          Try again
        </Button>
      </div>
    )
  }

  const { recommendations, query } = results
  const { activities = [], proTips = [], refinementPrompts = [] } = recommendations

  console.log("[Results] Activities count:", activities?.length || 0)
  console.log("[Results] First activity:", activities?.[0])

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No activities were generated. Please try again.</p>
        <Button onClick={onNewSearch} className="mt-4" variant="outline">
          New Search
        </Button>
      </div>
    )
  }
  
  const [showProTips, setShowProTips] = useState(false)

  const transformedActivities: ActivityData[] = activities.map((activity, index) => ({
    id: activity.id || `activity-${index}`,
    name: activity.name,
    experience: activity.experience,
    bestFor: activity.bestFor,
    specialElement: activity.specialElement,
    preparation: activity.preparation,
    tags: activity.tags || [],
    cost: activity.cost,
    duration: activity.duration,
    activityLevel: activity.activityLevel,
    locationType: activity.locationType,
    isInspiration: true,
  }))

  console.log("[Results] Transformed activities with all fields:", transformedActivities)

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-center">
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-white px-6 py-3 text-base font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Inspired Ideas for Your Group</span>
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-zinc-400">
          {query.group_size} people {query.location && `• ${query.location}`}
          {query.vibe && ` • ${query.vibe}`}
        </div>

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
          Creative Ideas to Explore
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

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-emerald-500/10 border border-primary/30 p-8 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_50%)]" />
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/30 mb-2">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold text-white">Ready to Book Real Activities?</h3>
            <p className="text-zinc-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Search for actual bookable experiences based on these ideas
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            onClick={() => {
              console.log("[v0] Find Real Activities clicked")
              // TODO: Implement navigation to real activity search
            }}
          >
            <Search className="w-5 h-5 mr-2" />
            Find Real Activities
          </Button>
        </div>
      </div>

      {proTips && proTips.length > 0 && (
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <button
            onClick={() => setShowProTips(!showProTips)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold">Pro Tips</h3>
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                {proTips.length}
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
              {proTips.map((tip, index) => (
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

      {refinementPrompts && refinementPrompts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-400">Get Different Ideas:</h3>
          <div className="flex flex-wrap gap-2">
            {refinementPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:border-primary/50 hover:bg-primary/10 transition-all bg-transparent"
                onClick={() => {
                  console.log("[v0] Refinement prompt clicked:", prompt)
                }}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
