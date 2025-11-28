"use client"

import { useState } from "react"
import { ActivityCard, type ActivityData } from "./activity-card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { ChevronDown, ChevronUp, Sparkles, Lightbulb, Search, Loader2, MapPin } from "lucide-react"
import type { ActivityRecommendation, ParsedQuery } from "@/lib/types"

interface ActivityResultsProps {
  results: {
    recommendations: ActivityRecommendation
    query: ParsedQuery
    isRealActivities?: boolean
  }
  onNewSearch: () => void
  onAddToShortlist?: (id: string) => void
  shortlistedIds?: string[]
  onFindRealActivities?: (location?: string) => void
  isSearchingReal?: boolean
  hasLocation?: boolean
}

export function ActivityResults({
  results,
  onNewSearch,
  onAddToShortlist,
  shortlistedIds = [],
  onFindRealActivities,
  isSearchingReal = false,
  hasLocation = false,
}: ActivityResultsProps) {
  const [showProTips, setShowProTips] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [locationError, setLocationError] = useState("")

  console.log("[Results] Received results:", results)
  console.log("[Results] Has recommendations:", !!results?.recommendations)

  if (!results || !results.recommendations) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No results to display</p>
        <Button onClick={onNewSearch} className="mt-4 bg-transparent" variant="outline">
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
        <Button onClick={onNewSearch} className="mt-4 bg-transparent" variant="outline">
          New Search
        </Button>
      </div>
    )
  }

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
    <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Your Search</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Group:</span>
            <span className="ml-2 text-white">{query.group_size}</span>
          </div>
          <div>
            <span className="text-zinc-500">Budget:</span>
            <span className="ml-2 text-white">
              {query.currency}
              {query.budget_per_person} per person
            </span>
          </div>
          {query.activity_category && (
            <div>
              <span className="text-zinc-500">Category:</span>
              <span className="ml-2 text-white">{query.activity_category === "diy" ? "DIY" : "Find Experience"}</span>
            </div>
          )}
          {query.location && (
            <div>
              <span className="text-zinc-500">Location:</span>
              <span className="ml-2 text-white">{query.location}</span>
            </div>
          )}
          {query.vibe && (
            <div>
              <span className="text-zinc-500">Vibe:</span>
              <span className="ml-2 text-white">{query.vibe}</span>
            </div>
          )}
          {query.group_relationship && (
            <div>
              <span className="text-zinc-500">Group Type:</span>
              <span className="ml-2 text-white">{query.group_relationship}</span>
            </div>
          )}
          {query.time_of_day && (
            <div>
              <span className="text-zinc-500">Time:</span>
              <span className="ml-2 text-white">{query.time_of_day}</span>
            </div>
          )}
          {query.indoor_outdoor && (
            <div>
              <span className="text-zinc-500">Setting:</span>
              <span className="ml-2 text-white">{query.indoor_outdoor}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-white px-6 py-3 text-base font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Inspired Ideas for Your Group</span>
        </Badge>
      </div>

      <div className="flex justify-end">
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
          {transformedActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ActivityCard
                activity={activity}
                categoryType={query.activity_category}
                onAddToShortlist={onAddToShortlist}
                isShortlisted={shortlistedIds.includes(activity.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {onFindRealActivities && !results.isRealActivities && (
        <div className="relative mt-12 md:mt-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-400/20 blur-3xl -z-10" />
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-emerald-400/10 border-2 border-primary/30 p-8 md:p-12 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.15),transparent_60%)]" />
            <div className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">Ready to Book Real Activities?</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto text-base md:text-lg leading-relaxed">
                {hasLocation && query?.location
                  ? `Find actual bookable experiences in ${query.location}`
                  : "Search for real activities you can book right now"}
              </p>

              {!hasLocation && (
                <div className="max-w-md mx-auto mb-6">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Enter a location (e.g., Madrid, Barcelona, Lisbon)"
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value)
                        setLocationError("")
                      }}
                      className="pl-10 bg-zinc-900/50 border-zinc-700 focus:border-primary text-white placeholder:text-zinc-500"
                      disabled={isSearchingReal}
                    />
                  </div>
                  {locationError && <p className="text-red-400 text-sm mt-2">{locationError}</p>}
                </div>
              )}

              <Button
                onClick={() => {
                  if (!hasLocation && !locationInput.trim()) {
                    setLocationError("Please enter a location to find real activities")
                    return
                  }
                  onFindRealActivities?.(hasLocation ? query?.location : locationInput.trim())
                }}
                disabled={isSearchingReal}
                aria-label="Search for real bookable activities"
                className="bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold text-lg px-8 py-6 h-auto transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/25"
              >
                {isSearchingReal ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching Viator...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Find Real Activities
                  </>
                )}
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
                <span>Powered by</span>
                <span className="font-semibold text-primary">Viator</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
