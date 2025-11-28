"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { ActivityData } from "@/components/activity-card"
import { Badge } from "@/components/ui/badge"
import { ErrorAlert, type ErrorType } from "@/components/error-alert"
import { Zap, Sparkles, ListChecks } from "lucide-react"
import { ToastContainer, showToast } from "@/components/toast"
import { ActivitySearchForm, type ActivitySearchFormData } from "@/components/activity-search-form"
import { ActivityResults } from "@/components/activity-results"
import { Button } from "@/components/ui/button"
import { ShortlistViewer } from "@/components/shortlist-viewer"
import { EmptySearchResults } from "@/components/empty-search-results"

const loadingMessages = {
  diy: [
    "Curating creative DIY ideas...",
    "Gathering materials and inspiration...",
    "Planning your perfect group activity...",
    "Finding unique ways to connect...",
  ],
  experience: [
    "Discovering bookable experiences...",
    "Searching for memorable activities...",
    "Finding the perfect group outing...",
    "Exploring local possibilities...",
  ],
}

const backupActivities: ActivityData[] = [
  {
    id: "backup-1",
    title: "Virtual Reality Gaming Session",
    description: "Immerse your team in cutting-edge VR experiences with multiplayer games and challenges.",
    tags: ["Indoor", "Team Building", "Adventure"],
    cost: 45,
    currency: "EUR",
    duration: "2h",
    activityLevel: "Moderate",
    locationType: "Indoor",
    specialFeature: "Latest VR technology with exclusive multiplayer experiences not available at home.",
    details: "All equipment provided. No prior VR experience needed. Includes refreshments and photo booth.",
  },
  {
    id: "backup-2",
    title: "Pottery & Wine Workshop",
    description: "Create ceramic masterpieces while enjoying local wines in a relaxed, creative atmosphere.",
    tags: ["Creative", "Relaxing", "Social"],
    cost: 60,
    currency: "EUR",
    duration: "3h",
    activityLevel: "Low",
    locationType: "Indoor",
    specialFeature:
      "Your creations are fired and delivered to you within a week, plus unlimited wine during the session.",
    details: "All materials included. Beginner-friendly instruction. Pieces can be picked up or shipped.",
  },
]

interface ApiResponse {
  success: boolean
  recommendations: {
    activities: ActivityData[]
    proTips?: string[]
    refinementPrompts?: string[]
  }
  query?: {
    group_size: string
    budget_per_person?: string
    currency?: string
    location_mode: string
    location?: string
    vibe?: string
  }
  error?: string
}

interface SearchHistory {
  activities: ActivityData[]
  refinementPrompts?: string[]
  timestamp: number
}

const locationInspirations = [
  "Creative offsite near Lisbon with surf sessions",
  "Nature retreat under €100pp within 2 hours of Berlin",
  "Remote cabin with team-building in the Alps",
  "Coastal workshop retreat in Portugal",
  "Mountain adventure near Zurich",
]

export default function Page() {
  const [groupSize, setGroupSize] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [budgetCurrency, setBudgetCurrency] = useState("EUR")
  const [locationMode, setLocationMode] = useState<"have" | "looking">("have")
  const [location, setLocation] = useState("")
  const [vibe, setVibe] = useState("")
  const [selectedInspiration, setSelectedInspiration] = useState("")

  const [userInput, setUserInput] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<ApiResponse | null>(null)
  const [showResults, setShowResults] = useState(false)

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const requestAbortRef = useRef<AbortController | null>(null)

  const [isSearchingReal, setIsSearchingReal] = useState(false)
  const [realActivitiesResults, setRealActivitiesResults] = useState<ApiResponse | null>(null)
  const [showRealActivities, setShowRealActivities] = useState(false)
  const [realActivitiesError, setRealActivitiesError] = useState<string | null>(null)

  const [showRealActivitiesSearch, setShowRealActivitiesSearch] = useState(false)
  const [refinementPrompts, setRefinementPrompts] = useState<string[]>([])

  const [shortlistedIds, setShortlistedIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("shortlistedIds")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [showShortlistViewer, setShowShortlistViewer] = useState(false)
  const [searchCategory, setSearchCategory] = useState<"diy" | "experience">("diy")

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setMessageFade(false)
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages[searchCategory].length)
        setMessageFade(true)
      }, 300)
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading, searchCategory])

  useEffect(() => {
    if (isLoading) {
      requestTimeoutRef.current = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, 30000)
    } else {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
        requestTimeoutRef.current = null
      }
      setShowTimeoutWarning(false)
    }

    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
      }
    }
  }, [isLoading])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("shortlistedIds", JSON.stringify(shortlistedIds))
    }
  }, [shortlistedIds])

  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFade, setMessageFade] = useState(true)

  const getCurrentMessage = () => {
    return loadingMessages[searchCategory][messageIndex % loadingMessages[searchCategory].length]
  }

  const validateForm = () => {
    if (!groupSize) {
      setError({ type: "validation", message: "Please select a group size" })
      return false
    }

    if (locationMode === "have" && !location.trim()) {
      setError({ type: "validation", message: "Please enter your location" })
      return false
    }

    setFormErrors({})
    setError(null)
    return true
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= 300) {
      setUserInput(value)
      setCharacterCount(value.length)
      setFormErrors({})
      if (error) setError(null)
    }
  }

  const fillExample = (example: string) => {
    setUserInput(example)
    setCharacterCount(example.length)
  }

  const handleSearch = async (formData: ActivitySearchFormData) => {
    console.log("[v0] handleSearch called with formData:", formData)

    if (formData.activityCategory) {
      setSearchCategory(formData.activityCategory === "find-experience" ? "experience" : "diy")
    }

    setIsLoading(true)
    setError(null)
    setShowResults(false)
    setSearchResults(null)
    setShowRealActivities(false)
    setRealActivitiesResults(null)
    setRealActivitiesError(null)
    setShowRealActivitiesSearch(false)
    window.scrollTo({ top: 0, behavior: "smooth" })

    requestAbortRef.current = new AbortController()

    try {
      const requestBody = {
        groupSize: formData.groupSize,
        budgetPerPerson: formData.budgetPerPerson,
        currency: formData.currency || "EUR",
        locationMode: formData.locationMode,
        location: formData.location,
        vibe: formData.vibe,
      }

      console.log("[v0] Sending to API:", requestBody)

      const response = await fetch("/api/generate-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: requestAbortRef.current.signal,
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 429) {
          throw { type: "ratelimit", message: errorData.error }
        } else if (response.status === 400) {
          throw { type: "validation", message: errorData.error }
        } else if (response.status >= 500) {
          throw { type: "generic", message: "Server error. Please try again." }
        } else {
          throw { type: "generic", message: errorData.error }
        }
      }

      const data: ApiResponse = await response.json()
      console.log("[v0] Full API response:", data)
      console.log("[v0] Recommendations object:", data.recommendations)
      console.log("[v0] Activities array:", data.recommendations?.activities)

      if (!data.success) {
        throw {
          type: "generic",
          message: data.error || "We couldn't generate ideas right now. Please try again in a few minutes.",
        }
      }

      if (!data.recommendations?.activities || data.recommendations.activities.length === 0) {
        console.warn("[v0] No activities returned from API")
        setError({
          type: "empty",
          message:
            "We couldn't generate ideas right now. Please try again in a few minutes or try describing your request differently.",
        })
        setIsLoading(false)
        return
      }

      console.log("[v0] Successfully received activities:", data.recommendations.activities.length)

      setSearchResults(data)
      setShowResults(true)

      console.log("[v0] ✅ Data rendered successfully!")
      showToast(`Generated ${data.recommendations.activities.length} inspired ideas!`, "success")
    } catch (err: any) {
      console.error("[v0] Error generating activities:", err)

      if (err.name === "AbortError") {
        setError(null)
      } else if (err.type) {
        setError({ type: err.type, message: err.message })
        showToast(err.message || "An error occurred", "error")
      } else if (err.message?.includes("fetch") || err.message?.includes("network")) {
        setError({ type: "network", message: "Connection problem. Check your internet and try again." })
        showToast("Network error. Check your connection.", "error")
      } else {
        setError({
          type: "generic",
          message: "We couldn't generate ideas right now. Please try again in a few minutes.",
        })
        showToast("Something went wrong. Please try again.", "error")
      }
    } finally {
      setIsLoading(false)
      requestAbortRef.current = null
    }
  }

  const handleCancelRequest = () => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort()
    }
    setIsLoading(false)
    setShowTimeoutWarning(false)
    showToast("Request cancelled", "info")
  }

  const handleKeepWaiting = () => {
    setShowTimeoutWarning(false)
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current)
    }
    requestTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 30000)
  }

  const handleRetry = () => {
    setError(null)
    const form = document.querySelector("form")
    if (form) {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
    }
  }

  const handleNewSearch = () => {
    setShowResults(false)
    setSearchResults(null)
    setShowRealActivities(false)
    setRealActivitiesResults(null)
    setRealActivitiesError(null)
    setShowRealActivitiesSearch(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFindRealActivities = async (providedLocation?: string) => {
    if (!searchResults?.query) {
      showToast("Please search for inspiration first", "error")
      return
    }

    const locationToSearch = providedLocation || searchResults.query.location

    if (!locationToSearch) {
      showToast("Please provide a location to find real activities", "error")
      return
    }

    setIsSearchingReal(true)
    setRealActivitiesError(null)

    try {
      console.log("[Page] Searching for real activities in:", locationToSearch)
      console.log("[Page] Search results query:", searchResults.query)

      const budgetPerPerson = searchResults.query.budget_per_person || "50"
      const currency = searchResults.query.currency || "EUR"
      const groupSize = searchResults.query.group_size || "2-5 people"

      const requestBody = {
        location: locationToSearch,
        budgetPerPerson: budgetPerPerson,
        currency: currency,
        groupSize: groupSize,
        vibe: searchResults.query.vibe,
        inspirationActivities: searchResults.recommendations.activities,
      }

      console.log("[Page] Real activities request with extracted values:", requestBody)

      const response = await fetch("/api/search-real-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("[Page] Real activities response status:", response.status)

      const data = await response.json()
      console.log("[Page] Real activities response data:", data)

      if (data.isEmpty) {
        setShowRealActivities(true)
        setRealActivitiesResults(data)
        showToast("No exact matches - showing suggestions", "info")

        setTimeout(() => {
          document.getElementById("real-activities")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 100)
        return
      }

      if (!response.ok) {
        if (response.status === 404 && data.step === "EMPTY_RESULTS") {
          const message = data.error || `No activities found in ${locationToSearch}`
          const suggestionsText =
            data.suggestions?.length > 0 ? `\n\nTry these destinations: ${data.suggestions.join(", ")}` : ""

          setRealActivitiesError(message + suggestionsText)
          showToast("No activities found - try a different location", "info")
          return
        }

        if (data.errorType === "CONFIGURATION_ERROR") {
          const errorMessage = [
            data.error,
            "",
            data.debugInfo?.message,
            "",
            "Steps to fix:",
            ...(data.debugInfo?.instructions || []),
          ].join("\n")

          console.error("[Page] Configuration error:", errorMessage)
          setRealActivitiesError(errorMessage)
          showToast("Viator API not configured - check error details", "error")
          return
        }

        const errorDetails = []
        if (data.errorType) errorDetails.push(`Error Type: ${data.errorType}`)
        if (data.debugInfo) {
          if (data.debugInfo.hasApiKey !== undefined)
            errorDetails.push(`API Key: ${data.debugInfo.hasApiKey ? "Present" : "Missing"}`)
          if (data.debugInfo.apiKeyLength) errorDetails.push(`Key Length: ${data.debugInfo.apiKeyLength}`)
          errorDetails.push(`Location: ${data.debugInfo.requestedLocation || locationToSearch}`)
          errorDetails.push(`Budget: ${data.debugInfo.requestedBudget || budgetPerPerson}`)
          errorDetails.push(`Currency: ${data.debugInfo.requestedCurrency || currency}`)
        }

        const fullErrorMessage = [
          data.error || "Failed to find real activities",
          "",
          "Debug Information:",
          ...errorDetails,
        ].join("\n")

        console.error("[Page] Detailed error:", fullErrorMessage)
        throw new Error(fullErrorMessage)
      }

      setRealActivitiesResults(data)
      setShowRealActivities(true)

      setTimeout(() => {
        document.getElementById("real-activities")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)

      showToast(`Found ${data.recommendations.activities.length} real activities!`, "success")
    } catch (error: any) {
      console.error("[Page] Error finding real activities:", error)
      setRealActivitiesError(error.message)
      showToast("Failed to find real activities - check console for details", "error")
    } finally {
      setIsSearchingReal(false)
    }
  }

  const handleAddToShortlist = (id: string) => {
    setShortlistedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  const getShortlistedActivities = (): ActivityData[] => {
    if (!searchResults?.recommendations?.activities) return []
    return searchResults.recommendations.activities.filter((activity) =>
      shortlistedIds.includes(activity.id || activity.name),
    )
  }

  const [error, setError] = useState<{ type: ErrorType; message?: string } | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <ToastContainer />

      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-4 right-4 z-50">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Using simulated data
          </Badge>
        </div>
      )}

      {searchResults && !isLoading && shortlistedIds.length > 0 && (
        <div className="fixed top-4 left-4 z-40">
          <Button
            onClick={() => setShowShortlistViewer(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center gap-2"
          >
            <ListChecks className="w-4 h-4" />
            View Shortlist ({shortlistedIds.length})
          </Button>
        </div>
      )}

      {showShortlistViewer && (
        <ShortlistViewer
          activities={getShortlistedActivities()}
          onClose={() => setShowShortlistViewer(false)}
          onRemoveFromShortlist={handleAddToShortlist}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-8 px-4 max-w-md w-full">
            {!showTimeoutWarning ? (
              <>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-emerald-400/30 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="h-16 flex items-center justify-center">
                  <p
                    className={`text-xl md:text-2xl font-medium text-center transition-opacity duration-300 ${
                      messageFade ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {getCurrentMessage()}
                  </p>
                </div>
                <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                    style={{
                      animation: "progress 8s ease-in-out forwards",
                    }}
                  />
                </div>
                <p className="text-sm text-zinc-500 animate-pulse">Crafting creative ideas for you...</p>
              </>
            ) : (
              <ErrorAlert type="timeout" onKeepWaiting={handleKeepWaiting} onCancel={handleCancelRequest} />
            )}
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {!showResults && !isLoading && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">CYALATER</h1>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance leading-tight">
                Find the perfect group activity in <span className="text-primary">60 seconds</span>
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 text-balance max-w-2xl mx-auto">
                AI-powered inspiration for teams, friends, and any gathering
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {error && (
                <div className="mb-6">
                  <ErrorAlert type={error.type} message={error.message} onRetry={handleRetry} />
                </div>
              )}

              <ActivitySearchForm onSubmit={handleSearch} isLoading={isLoading} />

              <p className="text-center mt-8 text-sm text-zinc-500 italic">
                Feels Good When Everyone's On the Same Page, Doesn't It?
              </p>
            </div>
          </>
        )}

        {searchResults && !isLoading && (
          <>
            <ActivityResults
              results={searchResults}
              onNewSearch={handleNewSearch}
              onFindRealActivities={handleFindRealActivities}
              isSearchingReal={isSearchingReal}
              hasLocation={!!searchResults.query?.location}
              onAddToShortlist={handleAddToShortlist}
              shortlistedIds={shortlistedIds}
            />

            {showRealActivities && realActivitiesResults?.isEmpty && (
              <div id="real-activities" className="mt-16 pt-16 border-t border-zinc-800">
                <EmptySearchResults
                  location={realActivitiesResults.query?.location || "this location"}
                  suggestions={realActivitiesResults.suggestions || []}
                  budgetHint={
                    realActivitiesResults.query?.budget_per_person
                      ? `Most activities here cost ${realActivitiesResults.query.currency}${Math.round(Number(realActivitiesResults.query.budget_per_person) * 2)}+`
                      : undefined
                  }
                  onSelectDestination={(dest) => handleFindRealActivities(dest)}
                />
              </div>
            )}

            {showRealActivities && realActivitiesResults && !realActivitiesResults.isEmpty && (
              <div id="real-activities" className="mt-16 pt-16 border-t border-zinc-800">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
                    <span className="text-2xl">🎫</span>
                    <span className="text-sm font-semibold text-primary">Real Bookable Activities</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-3">
                    {realActivitiesResults.query?.location
                      ? `Activities in ${realActivitiesResults.query.location}`
                      : "Real Activities You Can Book"}
                  </h2>

                  <p className="text-zinc-400 max-w-2xl mx-auto">Based on your preferences • Powered by Viator</p>
                </div>

                <ActivityResults
                  results={realActivitiesResults}
                  onNewSearch={() => {
                    setShowRealActivities(false)
                    setRealActivitiesResults(null)
                    handleNewSearch()
                  }}
                  isSearchingReal={false}
                  hasLocation={!!realActivitiesResults.query?.location}
                  onAddToShortlist={handleAddToShortlist}
                  shortlistedIds={shortlistedIds}
                />
              </div>
            )}

            {realActivitiesError && (
              <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                <h3 className="font-semibold text-red-400 mb-2">Error Finding Real Activities</h3>
                <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">{realActivitiesError}</pre>
                <Button onClick={() => setRealActivitiesError(null)} variant="outline" className="mt-4">
                  Dismiss
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
