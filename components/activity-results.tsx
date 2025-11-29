"use client"

import { useState, useEffect } from "react"
import { ActivityCard, type ActivityData } from "./activity-card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  Search,
  Loader2,
  MapPin,
  Edit2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import type { ActivityRecommendation, ParsedQuery, SearchContext } from "@/lib/types"

interface ActivityResultsProps {
  results: {
    recommendations: ActivityRecommendation
    query: ParsedQuery
    isRealActivities?: boolean
  }
  onNewSearch: () => void
  onAddToShortlist?: (id: string) => void
  shortlistedIds?: string[]
  onFindRealActivities?: (context: SearchContext) => void
  isSearchingReal?: boolean
  hasLocation?: boolean
  onRegenerateWithParams?: (params: Partial<ParsedQuery>) => void
}

export function ActivityResults({
  results,
  onNewSearch,
  onAddToShortlist,
  shortlistedIds = [],
  onFindRealActivities,
  isSearchingReal = false,
  hasLocation = false,
  onRegenerateWithParams,
}: ActivityResultsProps) {
  const [showProTips, setShowProTips] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [locationError, setLocationError] = useState("")

  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [editedParams, setEditedParams] = useState<Partial<ParsedQuery>>({})

  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    setIsRegenerating(false)
  }, [results])

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

  const getCurrentValue = (field: keyof ParsedQuery) => {
    return isEditingSearch && editedParams[field] !== undefined ? editedParams[field] : query[field]
  }

  const handleSubmitChanges = () => {
    console.log("[v0] ActivityResults: Submitting changes with editedParams:", editedParams)
    console.log("[v0] ActivityResults: Has onRegenerateWithParams?", !!onRegenerateWithParams)
    console.log("[v0] ActivityResults: Number of edited params:", Object.keys(editedParams).length)

    if (onRegenerateWithParams && Object.keys(editedParams).length > 0) {
      console.log("[v0] ActivityResults: Calling onRegenerateWithParams")
      setIsRegenerating(true)
      onRegenerateWithParams(editedParams)
      setIsEditingSearch(false)
      setEditedParams({})
    } else {
      console.warn("[v0] ActivityResults: Not calling onRegenerateWithParams - missing callback or no edits")
    }
  }

  const handleRegenerate = () => {
    handleSubmitChanges()
  }

  const buildSearchContext = (location: string): SearchContext => {
    console.log("[ActivityResults] Building search context with:")
    console.log("[ActivityResults] - Location:", location)
    console.log("[ActivityResults] - Activities from results:", activities)
    console.log("[ActivityResults] - Activities count:", activities?.length)
    console.log("[ActivityResults] - First activity:", activities?.[0])

    const context: SearchContext = {
      location,
      budgetPerPerson: Number.parseFloat(query.budget_per_person) || 50,
      currency: query.currency || "EUR",
      groupSize: query.group_size || "2 people",
      vibe: query.vibe,
      activityCategory: query.activity_category,
      inspirationActivities: activities,
      accessibilityNeeds: query.accessibility_needs,
    }

    console.log("[ActivityResults] Built context:", context)
    console.log("[ActivityResults] Inspiration activities in context:", context.inspirationActivities?.length)

    return context
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom duration-500">
      {isRegenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-white text-lg font-medium">Regenerating ideas...</p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-400">Your Search</h3>
          <div className="flex items-center gap-2">
            {isEditingSearch ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingSearch(false)
                    setEditedParams({})
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitChanges}
                  disabled={Object.keys(editedParams).length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingSearch(true)}
                className="text-zinc-400 hover:text-primary"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {/* Group Size */}
          <div>
            <span className="text-zinc-500">Group:</span>
            {isEditingSearch ? (
              <Input
                type="text"
                value={getCurrentValue("group_size") as string}
                onChange={(e) => setEditedParams({ ...editedParams, group_size: e.target.value })}
                className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                placeholder="e.g., 2-5 people"
              />
            ) : (
              <span className="ml-2 text-white">{query.group_size}</span>
            )}
          </div>

          {/* Budget */}
          <div>
            <span className="text-zinc-500">Budget:</span>
            {isEditingSearch ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  value={getCurrentValue("budget_per_person") as number}
                  onChange={(e) =>
                    setEditedParams({ ...editedParams, budget_per_person: Number.parseFloat(e.target.value) })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white text-sm h-8 w-20"
                />
                <span className="text-white text-xs">per person</span>
              </div>
            ) : (
              <span className="ml-2 text-white">
                {query.currency}
                {query.budget_per_person} per person
              </span>
            )}
          </div>

          {/* Category */}
          <div>
            <span className="text-zinc-500">Category:</span>
            {isEditingSearch ? (
              <Select
                value={getCurrentValue("activity_category") as string}
                onValueChange={(value) => setEditedParams({ ...editedParams, activity_category: value })}
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diy">DIY</SelectItem>
                  <SelectItem value="experience">Find Experience</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="ml-2 text-white">{query.activity_category === "diy" ? "DIY" : "Find Experience"}</span>
            )}
          </div>

          {/* Location */}
          <div>
            <span className="text-zinc-500">Location:</span>
            {isEditingSearch ? (
              <Input
                type="text"
                value={(getCurrentValue("location") as string) || ""}
                onChange={(e) => setEditedParams({ ...editedParams, location: e.target.value })}
                className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                placeholder="Enter location"
              />
            ) : query.location ? (
              <span className="ml-2 text-white">{query.location}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>

          {/* Vibe */}
          <div>
            <span className="text-zinc-500">Vibe:</span>
            {isEditingSearch ? (
              <Select
                value={(getCurrentValue("vibe") as string) || "not-specified"}
                onValueChange={(value) =>
                  setEditedParams({ ...editedParams, vibe: value === "not-specified" ? undefined : value })
                }
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8">
                  <SelectValue placeholder="Select vibe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="adventurous">Adventurous</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            ) : query.vibe ? (
              <span className="ml-2 text-white">{query.vibe}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>

          {/* Group Type */}
          <div>
            <span className="text-zinc-500">Group Type:</span>
            {isEditingSearch ? (
              <Select
                value={(getCurrentValue("group_relationship") as string) || "not-specified"}
                onValueChange={(value) =>
                  setEditedParams({
                    ...editedParams,
                    group_relationship: value === "not-specified" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="coworkers">Coworkers</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="mixed">Mixed group</SelectItem>
                </SelectContent>
              </Select>
            ) : query.group_relationship ? (
              <span className="ml-2 text-white">{query.group_relationship}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>

          {/* Time */}
          <div>
            <span className="text-zinc-500">Time:</span>
            {isEditingSearch ? (
              <Select
                value={(getCurrentValue("time_of_day") as string) || "not-specified"}
                onValueChange={(value) =>
                  setEditedParams({ ...editedParams, time_of_day: value === "not-specified" ? undefined : value })
                }
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            ) : query.time_of_day ? (
              <span className="ml-2 text-white">{query.time_of_day}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>

          {/* Setting */}
          <div>
            <span className="text-zinc-500">Setting:</span>
            {isEditingSearch ? (
              <Select
                value={(getCurrentValue("indoor_outdoor") as string) || "not-specified"}
                onValueChange={(value) =>
                  setEditedParams({ ...editedParams, indoor_outdoor: value === "not-specified" ? undefined : value })
                }
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8">
                  <SelectValue placeholder="Select setting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="no-preference">No preference</SelectItem>
                </SelectContent>
              </Select>
            ) : query.indoor_outdoor ? (
              <span className="ml-2 text-white">{query.indoor_outdoor}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>

          {/* Accessibility Needs */}
          <div>
            <span className="text-zinc-500">Accessibility:</span>
            {isEditingSearch ? (
              <Input
                type="text"
                value={(getCurrentValue("accessibility_needs") as string) || ""}
                onChange={(e) => setEditedParams({ ...editedParams, accessibility_needs: e.target.value })}
                className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                placeholder="Any accessibility needs"
              />
            ) : query.accessibility_needs ? (
              <span className="ml-2 text-white">{query.accessibility_needs}</span>
            ) : (
              <span className="ml-2 text-zinc-500 italic">Not specified</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-400 to-emerald-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <span>Inspired Ideas for Your Group</span>
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </h2>
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
                  {locationError && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <p>{locationError}</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => {
                  if (!hasLocation && !locationInput.trim()) {
                    setLocationError("Please enter a location to find real activities")
                    return
                  }
                  const locationToUse = hasLocation ? query?.location : locationInput.trim()
                  if (locationToUse) {
                    const context = buildSearchContext(locationToUse)
                    console.log("[ActivityResults] Calling onFindRealActivities with context:", context)
                    onFindRealActivities(context)
                  }
                }}
                disabled={isSearchingReal}
                aria-label="Search for real bookable activities"
                className="bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold text-lg px-8 py-6 h-auto transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/25"
              >
                {isSearchingReal ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="flex flex-col items-start">
                      <span>Searching Viator...</span>
                      <span className="text-xs font-normal opacity-80">Finding bookable activities in your area</span>
                    </span>
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
