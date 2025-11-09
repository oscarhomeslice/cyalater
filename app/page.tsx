"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ActivityData } from "@/components/activity-card"
import { Badge } from "@/components/ui/badge"
import { ErrorAlert, type ErrorType } from "@/components/error-alert"
import { Zap } from "lucide-react"
import { ToastContainer, showToast } from "@/components/toast"
import { ActivitySearchForm, type ActivitySearchFormData } from "@/components/activity-search-form"
import { ActivityResults } from "@/components/activity-results"
import { LoadingAnimation } from "@/components/loading-animation"

const loadingMessages = [
  "Understanding your group...",
  "Finding activities...",
  "Personalizing suggestions...",
  "Discovering unique ideas...",
  "Preparing your plan...",
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

interface BackupOptions {
  weatherAlternative?: ActivityData
  timeSaver?: ActivityData
  budgetFriendly?: ActivityData
}

interface ApiResponse {
  success: boolean
  recommendations: {
    activities: ActivityData[]
    backupOptions?: BackupOptions
    refinementPrompts?: string[]
    proTips?: string[]
  }
  error?: string
}

interface SearchHistory {
  activities: ActivityData[]
  proTips: string[]
  backupOptions?: BackupOptions
  refinementPrompts?: string[]
  refinement?: string
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
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [error, setError] = useState<{ type: ErrorType; message?: string } | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFade, setMessageFade] = useState(true)
  const [showResults, setShowResults] = useState(false)

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const requestAbortRef = useRef<AbortController | null>(null)

  const [shortlist, setShortlist] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showMaxWarning, setShowMaxWarning] = useState(false)

  const [filterLocation, setFilterLocation] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterBudget, setFilterBudget] = useState<string>("all")
  const [showProTips, setShowProTips] = useState(false)

  const [proTips, setProTips] = useState<string[]>([])
  const [backupOptions, setBackupOptions] = useState<BackupOptions | null>(null)
  const [refinementPrompts, setRefinementPrompts] = useState<string[]>([])

  const [refinementInput, setRefinementInput] = useState("")
  const [currentRefinement, setCurrentRefinement] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showRefinementExamples, setShowRefinementExamples] = useState(false)

  const [showVotingModal, setShowVotingModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // New state for the results of the search form
  const [searchResults, setSearchResults] = useState<any>(null) // Use a more specific type if possible

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
      // Show timeout warning after 30 seconds
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

  const getCurrentMessage = () => {
    const message = loadingMessages[messageIndex]
    // This replacement might not be as relevant with the new conversational input, but kept for now.
    // Consider removing if location is always parsed from text.
    return message.replace("{location}", location || "your area")
  }

  const validateForm = () => {
    if (!groupSize) {
      setError({ type: "validation", message: "Please select a group size" })
      setFormErrors({ groupSize: "Group size is required" })
      return false
    }

    if (locationMode === "have" && !location.trim()) {
      setError({ type: "validation", message: "Please enter your location" })
      setFormErrors({ location: "Location is required when you have a location" })
      return false
    }

    // Original validation for userInput is now less critical as it's constructed
    // but we'll keep a check for general description if needed later.
    // For now, if userInput is empty or too short and we have other fields,
    // we'll allow it, as the constructed input might be sufficient.
    // Consider adding a minimum character count for the vibe field if it becomes mandatory.
    if (userInput.trim().length < 20 && !selectedInspiration && !location && !vibe) {
      // This check might be too strict now. Let's rely on constructed input length implicitly.
      // For now, we'll disable the explicit userInput length check here.
      // If needed, we can re-evaluate based on API behavior.
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
    setActivities([])
    setProTips([])
    setBackupOptions(null)
    setRefinementPrompts([])
    setCurrentRefinement(null)
    setSearchHistory([])
    setFormErrors({})
    setShowTimeoutWarning(false)

    requestAbortRef.current = new AbortController()

    try {
      const requestBody = {
        formData: {
          groupSize: formData.groupSize,
          budgetPerPerson: formData.budgetPerPerson,
          currency: formData.currency || "EUR",
          locationMode: formData.locationMode,
          location: formData.location,
          inspirationPrompt: formData.inspirationPrompt,
          vibe: formData.vibe,
        },
      }

      console.log("[v0] Starting API request with body:", requestBody)

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
      console.log("[v0] API response data:", {
        success: data.success,
        activitiesCount: data.recommendations?.activities?.length || 0,
        proTipsCount: data.recommendations?.proTips?.length || 0,
        hasBackupOptions: !!data.recommendations?.backupOptions,
        refinementPromptsCount: data.recommendations?.refinementPrompts?.length || 0,
      })

      if (!data.success) {
        // Check if this is a TripAdvisor-related error
        const isTripAdvisorError = data.error?.toLowerCase().includes("tripadvisor")

        if (isTripAdvisorError) {
          throw {
            type: "tripadvisor",
            message:
              "We couldn't generate activities right now. TripAdvisor data may be temporarily unavailable. Please try again in a few minutes.",
          }
        }

        throw {
          type: "generic",
          message: data.error || "We couldn't generate activities right now. Please try again in a few minutes.",
        }
      }

      if (!data.recommendations.activities || data.recommendations.activities.length === 0) {
        console.warn("[v0] No activities returned from API")
        setError({
          type: "empty",
          message:
            "We couldn't generate activities right now. Please try again in a few minutes or try describing your request differently.",
        })
        setIsLoading(false)
        return
      }

      console.log("[v0] Successfully received activities:", data.recommendations.activities.length)
      console.log("[v0] Pro tips:", data.recommendations.proTips)
      console.log("[v0] Backup options:", data.recommendations.backupOptions)
      console.log("[v0] Refinement prompts:", data.recommendations.refinementPrompts)

      setActivities(data.recommendations.activities || [])
      setProTips(data.recommendations.proTips || [])
      setBackupOptions(data.recommendations.backupOptions || null)
      setRefinementPrompts(data.recommendations.refinementPrompts || [])
      setShowResults(true)
      setSearchHistory([
        {
          activities: data.recommendations.activities || [],
          proTips: data.recommendations.proTips || [],
          backupOptions: data.recommendations.backupOptions,
          refinementPrompts: data.recommendations.refinementPrompts,
          timestamp: Date.now(),
        },
      ])
      setSearchResults({ recommendations: data.recommendations }) // Store results in the new state variable

      console.log("[v0] ✅ Data rendered successfully!")
      showToast(`Found ${data.recommendations.activities.length} activities for you!`, "success")
    } catch (err: any) {
      console.error("[v0] Error generating activities:", err)

      if (err.name === "AbortError") {
        // Request was cancelled
        setError(null)
      } else if (err.type) {
        // Structured error from API
        setError({ type: err.type, message: err.message })
        const userMessage =
          err.type === "tripadvisor" ? "TripAdvisor data temporarily unavailable" : err.message || "An error occurred"
        showToast(userMessage, "error")
      } else if (err.message?.includes("fetch") || err.message?.includes("network")) {
        setError({ type: "network", message: "Connection problem. Check your internet and try again." })
        showToast("Network error. Check your connection.", "error")
      } else {
        setError({
          type: "generic",
          message: "We couldn't generate activities right now. Please try again in a few minutes.",
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
    // Reset the timeout for another 30 seconds
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current)
    }
    requestTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 30000)
  }

  const handleRetry = () => {
    setError(null)
    // Trigger the search again if an error occurred
    if (searchResults) {
      // If we had results before, retry with the same form data
      // This part needs to re-capture the last submitted form data.
      // For now, we'll just re-submit the main form which is a bit of a hack.
      // A better approach would be to store the last formData in state.
      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    } else {
      // If no results were ever fetched, we can't retry directly.
      // This scenario should ideally be handled by the initial form submission.
      // For simplicity, we'll rely on the main form submission.
      console.warn("Retry called but no previous search data found.")
    }
  }

  const handleAddToShortlist = (id: string) => {
    setShortlist((prev) => {
      if (prev.includes(id)) {
        showToast("Removed from shortlist", "info")
        return prev.filter((item) => item !== id)
      }

      if (prev.length >= 5) {
        setShowMaxWarning(true)
        setTimeout(() => setShowMaxWarning(false), 3000)
        showToast("Maximum 5 activities allowed in shortlist", "error")
        return prev
      }

      if (prev.length === 0) {
        triggerConfetti()
      }

      showToast("Added to shortlist!", "success")
      return [...prev, id]
    })
  }

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleRemoveFromShortlist = (id: string) => {
    setShortlist((prev) => prev.filter((item) => item !== id))
  }

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    setShortlist((prev) => {
      const draggedIndex = prev.indexOf(draggedItem)
      const targetIndex = prev.indexOf(targetId)
      const newList = [...prev]
      newList.splice(draggedIndex, 1)
      newList.splice(targetIndex, 0, draggedItem)
      return newList
    })
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleCreateVotingLink = () => {
    setShowVotingModal(true)
  }

  const handleEmailIdeas = () => {
    setShowEmailModal(true)
  }

  const handleDownloadPDF = () => {
    const shortlistedActivities = activities.filter((a) => shortlist.includes(a.id))

    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Replace with actual PDF generation:
    // const response = await fetch('/api/generate-pdf', {
    //   method: 'POST',
    //   body: JSON.stringify({ activities: shortlistedActivities })
    // })
    // const blob = await response.blob()
    // const url = window.URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = 'cyalater-activities.pdf'
    // a.click()
    // ============================================

    alert(`PDF download started with ${shortlistedActivities.length} activities`)
  }

  const handleNewSearch = () => {
    setShowResults(false)
    setSearchResults(null) // Clear search results
    setActivities([])
    setShortlist([])
    setProTips([])
    setUserInput("")
    setCharacterCount(0)
    setBackupOptions(null)
    setRefinementPrompts([])
    // Reset new form fields
    setGroupSize("")
    setBudgetAmount("")
    setBudgetCurrency("EUR")
    setLocationMode("have")
    setLocation("")
    setVibe("")
    setSelectedInspiration("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRefinement = (refinementType: string, customInput?: string) => {
    const refinementText = customInput || refinementType

    // Save current state to history before refining
    setSearchHistory((prev) => [
      ...prev,
      {
        activities,
        proTips,
        backupOptions: backupOptions || undefined,
        refinementPrompts: refinementPrompts || undefined,
        refinement: refinementText,
        timestamp: Date.now(),
      },
    ])

    setCurrentRefinement(refinementText)
    setIsLoading(true)
    setMessageIndex(0)
    setMessageFade(true)

    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Replace with actual refinement API call:
    // const response = await fetch('/api/refine-activities', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     originalInputs: { groupSize, budget, location, vibe },
    //     refinement: refinementText,
    //     currentActivities: activities
    //   })
    // })
    // const data = await response.json()
    // setActivities(data.activities)
    // setProTips(data.proTips)
    // ============================================

    const loadingTime = 4000 + Math.random() * 2000

    setTimeout(() => {
      // Simulate refined results by shuffling and slightly modifying current activities
      const refinedActivities = [...activities].sort(() => Math.random() - 0.5).slice(0, 6)
      setActivities(refinedActivities)
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      showToast(`Showing ${refinementText} options`, "success")
    }, loadingTime)
  }

  const handleCustomRefinement = () => {
    if (!refinementInput.trim()) return
    handleRefinement("custom", refinementInput)
    setRefinementInput("")
  }

  const handleGoBack = () => {
    if (searchHistory.length <= 1) return

    // Remove current state and go back to previous
    const newHistory = [...searchHistory]
    newHistory.pop() // Remove current
    const previousState = newHistory[newHistory.length - 1]

    setSearchHistory(newHistory)
    setActivities(previousState.activities)
    setProTips(previousState.proTips)
    setBackupOptions(previousState.backupOptions || null)
    setRefinementPrompts(previousState.refinementPrompts || [])
    setCurrentRefinement(previousState.refinement || null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const filteredActivities = activities.filter((activity) => {
    if (filterLocation !== "all" && activity.locationType !== filterLocation) return false
    if (filterLevel !== "all" && activity.activityLevel !== filterLevel) return false
    if (filterBudget !== "all") {
      const budgetRanges = {
        low: [0, 50],
        medium: [50, 100],
        high: [100, Number.POSITIVE_INFINITY],
      }
      // Check if filterBudget is a valid key before accessing budgetRanges
      if (filterBudget in budgetRanges) {
        const [min, max] = budgetRanges[filterBudget as keyof typeof budgetRanges]
        if (activity.cost < min || activity.cost > max) return false
      } else if (filterBudget === "free" && activity.cost !== 0) {
        // Handle the "free" budget explicitly if not covered by ranges
        return false
      }
    }
    return true
  })

  const validatedActivities = filteredActivities.filter((activity) => {
    // Check if activity has valid name or title
    const hasValidName = Boolean(activity?.name || activity?.title)
    // Check if activity has valid Amadeus URL (optional - Amadeus doesn't always provide direct booking URLs)
    const hasValidUrl = Boolean(activity?.amadeusUrl || activity?.tripAdvisorUrl)

    // Log warning for incomplete entries
    if (!hasValidName) {
      console.warn("[v0] ⚠️ Missing name for activity:", {
        id: activity?.id,
        name: activity?.name,
        title: activity?.title,
      })
    }

    // Only filter out if name is completely missing - URL is optional for Amadeus
    return hasValidName
  })

  const refinementExamples = [
    "Something with food",
    "No physical activity",
    "Under 2 hours",
    "More social interaction",
    "Unique local experiences",
  ]

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

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      {isLoading &&
        !searchResults && ( // Only show loading animation if there are no search results yet
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
                      <div className="w-3 h-3 rounded-full bg-primary" />
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
                  <p className="text-sm text-zinc-500 animate-pulse">Crafting something special for you...</p>
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
        {!searchResults &&
          !isLoading && ( // Check searchResults instead of showResults
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
                    {/* Changed error type to generic for consistent display with ActivitySearchForm */}
                    <ErrorAlert type="generic" message={error.message} onRetry={handleRetry} />
                  </div>
                )}

                <ActivitySearchForm onSubmit={handleSearch} isLoading={isLoading} />

                <p className="text-center mt-8 text-sm text-zinc-500 italic">
                  Feels Good When Everyone's On the Same Page, Doesn't It?
                </p>
              </div>
            </>
          )}
        {/* Loading State */}
        {isLoading && !searchResults && <LoadingAnimation />} {/* Show loading animation only when no results */}
        {/* Results */}
        {searchResults &&
          !isLoading && ( // Display results when available and not loading
            <ActivityResults
              results={searchResults} // Pass the searchResults state
              onNewSearch={handleNewSearch} // Use the existing handleNewSearch function
            />
          )}
      </div>
    </main>
  )
}
