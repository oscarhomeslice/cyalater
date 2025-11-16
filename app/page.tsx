"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ActivityData } from "@/components/activity-card"
import { Badge } from "@/components/ui/badge"
import { ErrorAlert, type ErrorType } from "@/components/error-alert"
import { Zap, Sparkles } from 'lucide-react'
import { ToastContainer, showToast } from "@/components/toast"
import { ActivitySearchForm, type ActivitySearchFormData } from "@/components/activity-search-form"
import { ActivityResults } from "@/components/activity-results"
import { Button } from "@/components/ui/button"

const loadingMessages = [
  "Generating inspired ideas...",
  "Exploring creative possibilities...",
  "Crafting unique suggestions...",
  "Finding the perfect vibe...",
  "Preparing your inspiration...",
]

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

  const [showRealActivitiesSearch, setShowRealActivitiesSearch] = useState(false)
  const [refinementPrompts, setRefinementPrompts] = useState<string[]>([])

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setMessageFade(false)
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
        setMessageFade(true)
      }, 300)
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading])

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

  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFade, setMessageFade] = useState(true)

  const getCurrentMessage = () => {
    return loadingMessages[messageIndex]
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
    setIsLoading(true)
    setError(null)
    setShowResults(false)
    setSearchResults(null)
    setShowRealActivitiesSearch(false)
    setError(null)
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
    setShowRealActivitiesSearch(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFindRealActivities = () => {
    setShowRealActivitiesSearch(true)
    showToast("Searching for real bookable activities...", "info")
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
            />

            {showRealActivitiesSearch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Searching for real bookable activities...</h3>
                      <p className="text-zinc-400">This feature is coming soon!</p>
                    </div>
                    <Button
                      onClick={() => setShowRealActivitiesSearch(false)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
