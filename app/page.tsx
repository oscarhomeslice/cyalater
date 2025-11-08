"use client"

import type React from "react"
import type { FormEvent } from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ActivityCard, type ActivityData } from "@/components/activity-card"
import { Badge } from "@/components/ui/badge"
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Mountain,
  DollarSign,
  Users,
  X,
  GripVertical,
  Link2,
  Mail,
  AlertCircle,
  Zap,
  Building2,
  Handshake,
  Undo2,
  Send,
  Download,
} from "lucide-react"
import { selectMockResponse } from "@/lib/mock-data"
import { VotingLinkModal } from "@/components/voting-link-modal"
import { EmailModal } from "@/components/email-modal"
import { ToastContainer, showToast } from "@/components/toast"

const loadingMessages = [
  "Understanding your group...",
  "Finding activities in {location}...",
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

interface SearchHistory {
  activities: ActivityData[]
  proTips: string[]
  refinement?: string
  timestamp: number
}

export default function Page() {
  const [userInput, setUserInput] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [error, setError] = useState("")
  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFade, setMessageFade] = useState(true)
  const [showResults, setShowResults] = useState(false)

  const [shortlist, setShortlist] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showMaxWarning, setShowMaxWarning] = useState(false)

  const [filterLocation, setFilterLocation] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterBudget, setFilterBudget] = useState<string>("all")
  const [showProTips, setShowProTips] = useState(false)

  const [proTips, setProTips] = useState<string[]>([])

  const [refinementInput, setRefinementInput] = useState("")
  const [currentRefinement, setCurrentRefinement] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showRefinementExamples, setShowRefinementExamples] = useState(false)

  const [showVotingModal, setShowVotingModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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

  const getCurrentMessage = () => {
    const message = loadingMessages[messageIndex]
    // This replacement might not be as relevant with the new conversational input, but kept for now.
    // Consider removing if location is always parsed from text.
    return message.replace("{location}", location || "your area")
  }

  const validateForm = () => {
    if (userInput.trim().length < 20) {
      setFormErrors({ userInput: "Tell us a bit more about your group (at least 20 characters)" })
      return false
    }
    setFormErrors({})
    return true
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= 300) {
      setUserInput(value)
      setCharacterCount(value.length)
      setFormErrors({})
      if (error) setError("")
    }
  }

  const fillExample = (example: string) => {
    setUserInput(example)
    setCharacterCount(example.length)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    if (userInput.trim().length < 20) {
      setError("Please provide more details (minimum 20 characters)")
      setFormErrors({ userInput: "Tell us a bit more about your group (at least 20 characters)" })
      showToast("Please describe your group activity (at least 20 characters)", "error")
      return
    }

    // Reset states
    setIsLoading(true)
    setError("")
    setMessageIndex(0)
    setMessageFade(true)
    setShowResults(false)
    setCurrentRefinement(null)
    setSearchHistory([])
    setFormErrors({})

    try {
      // ============================================
      // 🔧 FUTURE API INTEGRATION POINT
      // ============================================
      // Replace the mock implementation below with:
      //
      // const response = await fetch('/api/generate-activities', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userInput })
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Failed to generate activities');
      // }
      //
      // const data = await response.json();
      // setActivities(data.activities);
      // setProTips(data.proTips);
      // ============================================

      // Mock implementation - parse user input to extract parameters
      const input = userInput.toLowerCase()

      // Extract group size
      let groupSize = "6-10"
      if (input.match(/\b([2-5])\b|small|few/)) groupSize = "2-5"
      else if (input.match(/\b([6-9]|10)\b|medium/)) groupSize = "6-10"
      else if (input.match(/\b(1[1-9]|20)\b|large/)) groupSize = "11-20"
      else if (input.match(/\b(2[1-9]|[3-9]\d)\b|huge|big group/)) groupSize = "20+"

      // Extract budget
      let budget = "50-150"
      if (input.match(/free|no budget|zero/)) budget = "free"
      else if (input.match(/\$?([1-4]\d|50)|cheap|low budget|under.*50/)) budget = "under-50"
      else if (input.match(/\$?(5\d|[6-9]\d|1[0-4]\d|150)/)) budget = "50-150"
      else if (input.match(/\$?(15[1-9]|1[6-9]\d|[2-9]\d\d)|expensive|premium|high.*budget/)) budget = "150+"

      // Extract location
      let location = ""
      const locationMatch = input.match(/\b(berlin|barcelona|amsterdam|paris|london|remote|virtual|online)\b/i)
      if (locationMatch) location = locationMatch[0]

      // Extract vibe
      let vibe = ""
      if (input.match(/team.*build|bonding|corporate/)) vibe = "team bonding"
      else if (input.match(/birthday|celebration|party/)) vibe = "celebration"
      else if (input.match(/creative|workshop|artistic/)) vibe = "creative workshop"
      else if (input.match(/adventure|exciting|active/)) vibe = "adventurous"

      const mockResponse = selectMockResponse({ groupSize, budget, location, vibe })

      // Simulate API delay
      const loadingTime = 5000 + Math.random() * 3000
      await new Promise((resolve) => setTimeout(resolve, loadingTime))

      // Set results
      setActivities(mockResponse.activities)
      setProTips(mockResponse.proTips)
      setShowResults(true)
      setSearchHistory([
        {
          activities: mockResponse.activities,
          proTips: mockResponse.proTips,
          timestamp: Date.now(),
        },
      ])
      showToast(`Found ${mockResponse.activities.length} activities for you!`, "success")
    } catch (err) {
      console.error("[v0] Error generating activities:", err)
      setError("Something went wrong. Please try again.")
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setIsLoading(false)
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
    setActivities([])
    setShortlist([])
    setProTips([])
    setUserInput("")
    setCharacterCount(0)
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

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-8 px-4">
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
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {!showResults && (
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
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl hover:border-zinc-700 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="user-input" className="text-sm font-medium text-zinc-300 sr-only">
                      Describe your group activity
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="user-input"
                        value={userInput}
                        onChange={handleInputChange}
                        placeholder="Describe your group activity... (e.g., 'Team of 12 in Berlin, €80 per person budget, looking for creative bonding activities')"
                        rows={5}
                        className={`w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 resize-none text-base leading-relaxed rounded-2xl focus:scale-[1.01] ${
                          formErrors.userInput || error ? "border-red-500 focus:border-red-500" : ""
                        } ${characterCount >= 280 ? "border-orange-500/50" : ""}`}
                        aria-required="true"
                        aria-invalid={!!(formErrors.userInput || error)}
                        aria-describedby={formErrors.userInput || error ? "input-error" : "char-count"}
                      />
                      <div
                        id="char-count"
                        className={`absolute bottom-3 right-3 text-xs font-medium transition-colors ${
                          characterCount >= 280
                            ? "text-orange-400"
                            : characterCount > 0
                              ? "text-zinc-500"
                              : "text-zinc-600"
                        }`}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {characterCount}/300
                      </div>
                    </div>
                    {(formErrors.userInput || error) && (
                      <p
                        id="input-error"
                        className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.userInput || error}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">Try:</p>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          fillExample(
                            "Birthday celebration for 8 friends in Barcelona, adventurous vibe, €100 per person",
                          )
                        }
                        className="text-left text-xs text-zinc-400 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800/50"
                      >
                        "Birthday celebration for 8 friends in Barcelona, adventurous vibe, €100 per person"
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          fillExample("Remote team of 15, virtual activities under $50 per person, team building focus")
                        }
                        className="text-left text-xs text-zinc-400 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800/50"
                      >
                        "Remote team of 15, virtual activities under $50 per person, team building focus"
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={userInput.trim().length < 20}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 text-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Generate activity ideas"
                  >
                    Generate Ideas
                  </Button>
                </form>
              </div>

              <p className="text-center mt-8 text-sm text-zinc-500 italic">
                Feels Good When Everyone's On the Same Page, Doesn't It?
              </p>
            </div>
          </>
        )}

        {showResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">CYALATER</h1>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    {currentRefinement && (
                      <div className="mb-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-sm animate-in fade-in slide-in-from-left duration-300">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>
                          Showing <span className="font-semibold text-primary">{currentRefinement}</span> options
                        </span>
                      </div>
                    )}
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                      <span className="text-primary">Your Activities</span>
                    </h2>
                    <p className="text-zinc-400">{filteredActivities.length} activities found</p>
                  </div>
                  <div className="flex gap-2">
                    {searchHistory.length > 1 && (
                      <Button
                        onClick={handleGoBack}
                        variant="outline"
                        className="bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800 hover:border-primary/50"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Go Back
                      </Button>
                    )}
                    <Button
                      onClick={handleNewSearch}
                      variant="outline"
                      className="bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800 hover:border-primary/50 shrink-0"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      New Search
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mb-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 animate-in fade-in slide-in-from-top duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Refine Your Search</h3>
                </div>

                <div className="space-y-4">
                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleRefinement("more adventurous")}
                      size="sm"
                      className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 text-white rounded-full"
                    >
                      <Mountain className="w-4 h-4 mr-2" />
                      More adventurous
                    </Button>
                    <Button
                      onClick={() => handleRefinement("indoor only")}
                      size="sm"
                      className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 text-white rounded-full"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Indoor only
                    </Button>
                    <Button
                      onClick={() => handleRefinement("lower budget")}
                      size="sm"
                      className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 text-white rounded-full"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Lower budget
                    </Button>
                    <Button
                      onClick={() => handleRefinement("team building focus")}
                      size="sm"
                      className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 text-white rounded-full"
                    >
                      <Handshake className="w-4 h-4 mr-2" />
                      Team building focus
                    </Button>
                    <Button
                      onClick={() => handleRefinement("unique experiences")}
                      size="sm"
                      className="bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 text-white rounded-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Unique experiences
                    </Button>
                  </div>

                  {/* Conversational refinement input */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={refinementInput}
                          onChange={(e) => setRefinementInput(e.target.value)}
                          onFocus={() => setShowRefinementExamples(true)}
                          onBlur={() => setTimeout(() => setShowRefinementExamples(false), 200)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCustomRefinement()
                            }
                          }}
                          placeholder="Or describe what you're looking for..."
                          className="w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-colors duration-200 h-11"
                        />
                        {/* Examples tooltip */}
                        {showRefinementExamples && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-xs text-zinc-400 mb-2 font-medium">Try these examples:</p>
                            <div className="space-y-1">
                              {refinementExamples.map((example, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setRefinementInput(example)
                                    setShowRefinementExamples(false)
                                  }}
                                  className="block w-full text-left text-sm text-zinc-300 hover:text-primary hover:bg-zinc-800/50 px-2 py-1.5 rounded transition-colors"
                                >
                                  {example}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleCustomRefinement}
                        disabled={!refinementInput.trim()}
                        className="bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Refine
                      </Button>
                    </div>
                  </div>

                  {/* History breadcrumb */}
                  {searchHistory.length > 1 && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Search history:</span>
                      <div className="flex items-center gap-1">
                        {searchHistory.map((item, index) => (
                          <div key={item.timestamp} className="flex items-center gap-1">
                            {index > 0 && <span>→</span>}
                            <button
                              onClick={() => {
                                const newHistory = searchHistory.slice(0, index + 1)
                                setSearchHistory(newHistory)
                                setActivities(item.activities)
                                setProTips(item.proTips)
                                setCurrentRefinement(item.refinement || null)
                              }}
                              className="hover:text-primary transition-colors"
                            >
                              {item.refinement || "Original"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-80 shrink-0">
                  <div className="lg:sticky lg:top-8 space-y-6">
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-left duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                          Your Shortlist
                        </h3>
                        {shortlist.length > 0 && (
                          <Badge
                            className="bg-primary/20 text-primary border-primary/30"
                            aria-label={`${shortlist.length} of 5 activities in shortlist`}
                          >
                            {shortlist.length}/5
                          </Badge>
                        )}
                      </div>

                      {showMaxWarning && (
                        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-orange-400">Maximum 5 activities allowed in shortlist</p>
                        </div>
                      )}

                      {shortlist.length === 0 ? (
                        <div className="text-center py-8">
                          <div
                            className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3"
                            aria-hidden="true"
                          >
                            <Users className="w-8 h-8 text-zinc-600" />
                          </div>
                          <p className="text-sm text-zinc-400 font-medium mb-1">Add activities to compare and share</p>
                          <p className="text-xs text-zinc-600">Click "Add to Shortlist" on cards below</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {shortlist.map((id) => {
                            const activity = activities.find((a) => a.id === id)
                            return activity ? (
                              <div
                                key={id}
                                draggable
                                onDragStart={() => handleDragStart(id)}
                                onDragOver={(e) => handleDragOver(e, id)}
                                onDragEnd={handleDragEnd}
                                tabIndex={0}
                                role="listitem"
                                aria-label={`${activity.title}, ${activity.cost} euros, ${activity.duration}. Press space to reorder.`}
                                onKeyDown={(e) => {
                                  if (e.key === "Delete" || e.key === "Backspace") {
                                    handleRemoveFromShortlist(id)
                                  }
                                }}
                                className={`bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 hover:border-primary/50 transition-all duration-200 cursor-move group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                                  draggedItem === id ? "opacity-50 scale-95" : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <GripVertical
                                    className="w-4 h-4 text-zinc-600 group-hover:text-primary shrink-0 mt-1"
                                    aria-hidden="true"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium mb-1 truncate">{activity.title}</p>
                                    <p className="text-xs text-zinc-500">
                                      €{activity.cost} • {activity.duration}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromShortlist(id)}
                                    className="shrink-0 w-6 h-6 rounded-full bg-zinc-700/50 hover:bg-red-500/20 flex items-center justify-center transition-colors group/btn focus:outline-none focus:ring-2 focus:ring-red-400"
                                    aria-label={`Remove ${activity.title} from shortlist`}
                                  >
                                    <X className="w-3 h-3 text-zinc-400 group-hover/btn:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            ) : null
                          })}

                          <div className="pt-3 space-y-2 border-t border-zinc-800">
                            {shortlist.length >= 2 && (
                              <Button
                                onClick={handleCreateVotingLink}
                                className="w-full bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                                aria-label="Create voting link for shortlisted activities"
                              >
                                <Link2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                Create Voting Link
                              </Button>
                            )}
                            <Button
                              onClick={handleEmailIdeas}
                              variant="outline"
                              className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                              aria-label="Email shortlisted activities"
                            >
                              <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                              Email These Ideas
                            </Button>
                            <Button
                              onClick={handleDownloadPDF}
                              variant="outline"
                              className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                              aria-label="Download shortlist as PDF"
                            >
                              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                              Download PDF
                            </Button>
                          </div>

                          <p className="text-xs text-zinc-600 text-center pt-2">Drag to reorder • Max 5 activities</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Activities found</span>
                          <span className="font-bold text-primary">{filteredActivities.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Avg. cost</span>
                          <span className="font-bold">
                            €
                            {filteredActivities.length > 0
                              ? Math.round(
                                  filteredActivities.reduce((sum, a) => sum + a.cost, 0) / filteredActivities.length,
                                )
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">In shortlist</span>
                          <span className="font-bold">{shortlist.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-zinc-400 mb-2 block">Location Type</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={filterLocation === "all" ? "default" : "outline"}
                              onClick={() => setFilterLocation("all")}
                              className={
                                filterLocation === "all"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              All
                            </Button>
                            <Button
                              size="sm"
                              variant={filterLocation === "Indoor" ? "default" : "outline"}
                              onClick={() => setFilterLocation("Indoor")}
                              className={
                                filterLocation === "Indoor"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Indoor
                            </Button>
                            <Button
                              size="sm"
                              variant={filterLocation === "Outdoor" ? "default" : "outline"}
                              onClick={() => setFilterLocation("Outdoor")}
                              className={
                                filterLocation === "Outdoor"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              <Mountain className="w-3 h-3 mr-1" />
                              Outdoor
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-zinc-400 mb-2 block">Activity Level</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={filterLevel === "all" ? "default" : "outline"}
                              onClick={() => setFilterLevel("all")}
                              className={
                                filterLevel === "all"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              All
                            </Button>
                            <Button
                              size="sm"
                              variant={filterLevel === "Low" ? "default" : "outline"}
                              onClick={() => setFilterLevel("Low")}
                              className={
                                filterLevel === "Low"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              Low
                            </Button>
                            <Button
                              size="sm"
                              variant={filterLevel === "Moderate" ? "default" : "outline"}
                              onClick={() => setFilterLevel("Moderate")}
                              className={
                                filterLevel === "Moderate"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              Moderate
                            </Button>
                            <Button
                              size="sm"
                              variant={filterLevel === "High" ? "default" : "outline"}
                              onClick={() => setFilterLevel("High")}
                              className={
                                filterLevel === "High"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              High
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-zinc-400 mb-2 block">Budget Range</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={filterBudget === "all" ? "default" : "outline"}
                              onClick={() => setFilterBudget("all")}
                              className={
                                filterBudget === "all"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              All
                            </Button>
                            <Button
                              size="sm"
                              variant={filterBudget === "low" ? "default" : "outline"}
                              onClick={() => setFilterBudget("low")}
                              className={
                                filterBudget === "low"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              <DollarSign className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={filterBudget === "medium" ? "default" : "outline"}
                              onClick={() => setFilterBudget("medium")}
                              className={
                                filterBudget === "medium"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              <DollarSign className="w-3 h-3" />
                              <DollarSign className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={filterBudget === "high" ? "default" : "outline"}
                              onClick={() => setFilterBudget("high")}
                              className={
                                filterBudget === "high"
                                  ? "bg-primary text-black hover:bg-primary/90"
                                  : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                              }
                            >
                              <DollarSign className="w-3 h-3" />
                              <DollarSign className="w-3 h-3" />
                              <DollarSign className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="flex-1 space-y-12">
                  {filteredActivities.length > 0 ? (
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      role="list"
                      aria-label="Activity suggestions"
                    >
                      {filteredActivities.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                          role="listitem"
                        >
                          <ActivityCard
                            activity={activity}
                            onAddToShortlist={handleAddToShortlist}
                            isShortlisted={shortlist.includes(activity.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16" role="status" aria-live="polite">
                      <div
                        className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4"
                        aria-hidden="true"
                      >
                        <Filter className="w-10 h-10 text-zinc-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No activities match your filters</h3>
                      <p className="text-zinc-400 mb-4">Try adjusting your filter settings</p>
                      <Button
                        onClick={() => {
                          setFilterLocation("all")
                          setFilterLevel("all")
                          setFilterBudget("all")
                          showToast("Filters cleared", "info")
                        }}
                        variant="outline"
                        className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}

                  <div className="border-t border-zinc-800 pt-12">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">Backup Options</h3>
                      <p className="text-zinc-400">Just in case you need a Plan B</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {backupActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-lg">{activity.title}</h4>
                            <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700 text-xs">
                              Backup
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mb-3">{activity.description}</p>
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>€{activity.cost}</span>
                            <span>•</span>
                            <span>{activity.duration}</span>
                            <span>•</span>
                            <span>{activity.locationType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {proTips.length > 0 && (
                    <div className="border-t border-zinc-800 pt-12">
                      <button
                        onClick={() => setShowProTips(!showProTips)}
                        className="flex items-center justify-between w-full mb-6 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-2xl font-bold">Pro Tips</h3>
                            <p className="text-sm text-zinc-400">Make the most of your group activity</p>
                          </div>
                        </div>
                        {showProTips ? (
                          <ChevronUp className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                        )}
                      </button>

                      {showProTips && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {proTips.map((tip, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20 rounded-xl p-6"
                            >
                              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-primary font-bold">{index + 1}</span>
                              </div>
                              <p className="text-sm text-zinc-300">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-zinc-800 pt-12">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">Not quite right?</h3>
                      <p className="text-zinc-400">Let's refine your search with these quick adjustments</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        onClick={() => handleRefinement("adventurous")}
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                      >
                        <Mountain className="w-4 h-4 mr-2" />
                        Make it more adventurous
                      </Button>
                      <Button
                        onClick={() => handleRefinement("indoor")}
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Keep it indoors
                      </Button>
                      <Button
                        onClick={() => handleRefinement("budget")}
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        More budget-friendly
                      </Button>
                      <Button
                        onClick={() => handleRefinement("team-building")}
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add team-building focus
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center mt-16 text-sm text-zinc-500 italic">
              Feels Good When Everyone's On the Same Page, Doesn't It?
            </p>
          </div>
        )}
      </div>

      <VotingLinkModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        activities={activities.filter((a) => shortlist.includes(a.id))}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        activities={activities.filter((a) => shortlist.includes(a.id))}
      />
    </main>
  )
}
