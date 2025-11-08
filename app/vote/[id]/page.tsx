"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, Users, Trophy, ArrowRight, Sparkles, Crown, X } from "lucide-react"
import { showToast, ToastContainer } from "@/components/toast"

interface Activity {
  id: string
  title: string
  description: string
  cost: number
  currency: string
  votes: number
  voters: string[]
}

interface VoteData {
  eventTitle: string
  activities: Activity[]
  organizerEmail: string
  isClosed: boolean
}

export default function VotingPage({ params }: { params: { id: string } }) {
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [voterName, setVoterName] = useState("")
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showOrganizerView, setShowOrganizerView] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)

  useEffect(() => {
    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Fetch voting data from API:
    // const response = await fetch(`/api/vote/${params.id}`)
    // const data = await response.json()
    // setVoteData(data)
    //
    // Check if user is organizer (via cookie or auth):
    // const isOrg = await checkIfOrganizer(params.id)
    // setIsOrganizer(isOrg)
    // ============================================

    // Mock data for development
    const mockData: VoteData = {
      eventTitle: "Team Building Day - March 2025",
      organizerEmail: "organizer@example.com",
      isClosed: false,
      activities: [
        {
          id: "1",
          title: "Escape Room Challenge",
          description: "Solve puzzles and escape together in this thrilling team challenge.",
          cost: 45,
          currency: "EUR",
          votes: 3,
          voters: ["Alice", "Bob", "Charlie"],
        },
        {
          id: "2",
          title: "Cooking Workshop",
          description: "Learn to cook authentic Italian cuisine with a professional chef.",
          cost: 65,
          currency: "EUR",
          votes: 5,
          voters: ["Alice", "David", "Emma", "Frank", "Grace"],
        },
        {
          id: "3",
          title: "Outdoor Adventure Park",
          description: "Zip-lining, climbing walls, and team obstacle courses in nature.",
          cost: 55,
          currency: "EUR",
          votes: 2,
          voters: ["Bob", "Emma"],
        },
      ],
    }

    setVoteData(mockData)
    // Simulate organizer check (in production, this would be based on auth)
    setIsOrganizer(true)
  }, [params.id])

  const handleVoteToggle = (activityId: string) => {
    if (hasVoted || voteData?.isClosed) return

    setSelectedActivities((prev) => {
      if (prev.includes(activityId)) {
        return prev.filter((id) => id !== activityId)
      }
      return [...prev, activityId]
    })
  }

  const handleSubmitVotes = () => {
    if (selectedActivities.length === 0) {
      showToast("Please select at least one activity", "error")
      return
    }

    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Submit votes to API:
    // await fetch(`/api/vote/${params.id}`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     voterName: voterName || 'Anonymous',
    //     votes: selectedActivities
    //   })
    // })
    // ============================================

    // Update local state (in production, refetch from API)
    setVoteData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        activities: prev.activities.map((activity) => {
          if (selectedActivities.includes(activity.id)) {
            return {
              ...activity,
              votes: activity.votes + 1,
              voters: [...activity.voters, voterName || "Anonymous"],
            }
          }
          return activity
        }),
      }
    })

    setHasVoted(true)
    showToast("Your votes have been submitted!", "success")
  }

  const handleCloseVoting = () => {
    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // await fetch(`/api/vote/${params.id}/close`, { method: 'POST' })
    // ============================================

    setVoteData((prev) => (prev ? { ...prev, isClosed: true } : prev))
    showToast("Voting has been closed", "info")
  }

  const handlePickWinner = () => {
    if (!voteData) return

    const topActivity = [...voteData.activities].sort((a, b) => b.votes - a.votes)[0]
    setWinner(topActivity.id)
    showToast(`${topActivity.title} is the winner!`, "success")
  }

  if (!voteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading voting page...</p>
        </div>
      </div>
    )
  }

  const sortedActivities = [...voteData.activities].sort((a, b) => b.votes - a.votes)
  const topActivity = sortedActivities[0]

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <ToastContainer />

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">CYALATER</h1>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
        </div>

        {/* Organizer toggle */}
        {isOrganizer && (
          <div className="mb-6 flex justify-center">
            <Button
              onClick={() => setShowOrganizerView(!showOrganizerView)}
              variant="outline"
              size="sm"
              className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
            >
              <Crown className="w-4 h-4 mr-2" />
              {showOrganizerView ? "Switch to Voter View" : "Switch to Organizer View"}
            </Button>
          </div>
        )}

        {/* Event title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{voteData.eventTitle}</h2>
          {!showOrganizerView && (
            <p className="text-xl text-zinc-400 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Help choose the best activity!
            </p>
          )}
          {voteData.isClosed && (
            <Badge className="mt-3 bg-orange-500/20 text-orange-400 border-orange-500/30">Voting Closed</Badge>
          )}
        </div>

        {/* Voter name input */}
        {!hasVoted && !showOrganizerView && !voteData.isClosed && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4">
              <label htmlFor="voter-name" className="text-sm text-zinc-400 mb-2 block">
                Voting as (optional)
              </label>
              <Input
                id="voter-name"
                type="text"
                placeholder="Enter your name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Organizer View */}
        {showOrganizerView && (
          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Organizer Controls
              </h3>
              <div className="flex flex-wrap gap-3">
                {!voteData.isClosed && (
                  <Button
                    onClick={handleCloseVoting}
                    className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Voting
                  </Button>
                )}
                <Button
                  onClick={handlePickWinner}
                  className="bg-gradient-to-r from-primary to-emerald-400 text-black font-semibold hover:from-primary/90 hover:to-emerald-400/90"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Pick Winner
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Start Planning
                </Button>
              </div>
            </div>

            {/* Vote summary */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Vote Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total votes cast</span>
                  <span className="font-bold text-primary">
                    {voteData.activities.reduce((sum, a) => sum + a.votes, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Unique voters</span>
                  <span className="font-bold">{new Set(voteData.activities.flatMap((a) => a.voters)).size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Leading activity</span>
                  <span className="font-bold text-primary">{topActivity.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity cards */}
        <div className="space-y-4 mb-8">
          {sortedActivities.map((activity, index) => {
            const isSelected = selectedActivities.includes(activity.id)
            const isWinner = winner === activity.id
            const isTop = index === 0 && voteData.isClosed

            return (
              <div
                key={activity.id}
                className={`bg-zinc-900/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 ${
                  isWinner
                    ? "border-primary bg-gradient-to-br from-primary/10 to-emerald-400/10 shadow-lg shadow-primary/20"
                    : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-zinc-800 hover:border-zinc-700"
                } ${hasVoted || voteData.isClosed ? "" : "cursor-pointer"}`}
                onClick={() => !showOrganizerView && handleVoteToggle(activity.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{activity.title}</h3>
                      {isWinner && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          <Trophy className="w-3 h-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                      {isTop && !isWinner && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Top Choice
                        </Badge>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm mb-3">{activity.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-500">
                        {activity.currency}
                        {activity.cost} per person
                      </span>
                    </div>
                  </div>

                  {!showOrganizerView && !hasVoted && !voteData.isClosed && (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-primary border-primary" : "border-zinc-600 hover:border-primary"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                </div>

                {/* Vote count */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium">
                      {activity.votes} {activity.votes === 1 ? "vote" : "votes"}
                    </span>
                  </div>

                  {/* Vote bar */}
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            voteData.activities.reduce((sum, a) => sum + a.votes, 0) > 0
                              ? (activity.votes / voteData.activities.reduce((sum, a) => sum + a.votes, 0)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Show voters in organizer view */}
                  {showOrganizerView && activity.voters.length > 0 && (
                    <div className="text-xs text-zinc-500">
                      {activity.voters.slice(0, 3).join(", ")}
                      {activity.voters.length > 3 && ` +${activity.voters.length - 3} more`}
                    </div>
                  )}
                </div>

                {/* Voter list for organizer */}
                {showOrganizerView && activity.voters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">Voted by:</p>
                    <div className="flex flex-wrap gap-2">
                      {activity.voters.map((voter, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-zinc-800/50 text-zinc-400 border-zinc-700 text-xs"
                        >
                          {voter}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit button */}
        {!hasVoted && !showOrganizerView && !voteData.isClosed && (
          <div className="text-center">
            <Button
              onClick={handleSubmitVotes}
              disabled={selectedActivities.length === 0}
              className="w-full max-w-md h-14 text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 text-black shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit {selectedActivities.length > 0 && `(${selectedActivities.length})`} Vote
              {selectedActivities.length !== 1 && "s"}
            </Button>
            <p className="text-sm text-zinc-500 mt-3">You can vote for multiple activities</p>
          </div>
        )}

        {/* Thank you message */}
        {hasVoted && !showOrganizerView && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Thanks for voting!</h3>
              <p className="text-zinc-400 mb-4">
                Your votes have been recorded
                {voterName && (
                  <>
                    {" "}
                    as <span className="text-primary font-medium">{voterName}</span>
                  </>
                )}
              </p>
              <p className="text-sm text-zinc-500">The organizer will share the final decision soon. See you there!</p>
            </div>
          </div>
        )}

        {/* Closed voting message */}
        {voteData.isClosed && !showOrganizerView && !hasVoted && (
          <div className="text-center">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Voting has closed</h3>
              <p className="text-zinc-400">The organizer will announce the final decision soon.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center mt-12 text-sm text-zinc-500 italic">
          Feels Good When Everyone's On the Same Page, Doesn't It?
        </p>
      </div>
    </main>
  )
}
