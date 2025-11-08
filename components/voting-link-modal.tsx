"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Copy, Check, Mail, MessageSquare, QrCode, Link2, Sparkles } from "lucide-react"
import type { ActivityData } from "./activity-card"
import { showToast } from "./toast"

interface VotingLinkModalProps {
  isOpen: boolean
  onClose: () => void
  activities: ActivityData[]
}

export function VotingLinkModal({ isOpen, onClose, activities }: VotingLinkModalProps) {
  const [eventTitle, setEventTitle] = useState("")
  const [organizerName, setOrganizerName] = useState("")
  const [organizerEmail, setOrganizerEmail] = useState("")
  const [joinWaitlist, setJoinWaitlist] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [votingLink, setVotingLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  if (!isOpen) return null

  const handleGenerateLink = () => {
    // Generate unique ID for the voting link
    const uniqueId = Math.random().toString(36).substring(2, 9)
    const link = `cyalater.com/vote/${uniqueId}`
    setVotingLink(link)
    setShowSuccess(true)
    showToast("Voting link created successfully!", "success")

    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Replace with actual API call to create voting session:
    // const response = await fetch('/api/create-voting-link', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     activities: activities.map(a => a.id),
    //     eventTitle,
    //     organizerName,
    //     organizerEmail,
    //     joinWaitlist
    //   })
    // })
    // const { votingUrl } = await response.json()
    // setVotingLink(votingUrl)
    // ============================================
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(votingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast("Link copied to clipboard!", "success")
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(eventTitle || "Vote on our group activity!")
    const body = encodeURIComponent(
      `Help us decide! Vote on your favorite activity:\n\n${votingLink}\n\nActivities to choose from:\n${activities.map((a) => `- ${a.title}`).join("\n")}`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Help us decide on our group activity! Vote here: ${votingLink}\n\nActivities: ${activities.map((a) => a.title).join(", ")}`,
    )
    window.open(`https://wa.me/?text=${text}`)
  }

  const handleShareSlack = () => {
    const text = encodeURIComponent(
      `Help us decide! Vote on your favorite activity: ${votingLink}\n\nActivities: ${activities.map((a) => a.title).join(", ")}`,
    )
    window.open(`https://slack.com/intl/en-us/help/articles/201259356-Share-links-in-Slack?text=${text}`)
  }

  const handleReset = () => {
    setShowSuccess(false)
    setEventTitle("")
    setOrganizerName("")
    setOrganizerEmail("")
    setJoinWaitlist(false)
    setVotingLink("")
    setCopied(false)
    setShowQR(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voting-modal-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center" aria-hidden="true">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="voting-modal-title" className="text-2xl font-bold">
                Create Voting Link
              </h2>
              <p className="text-sm text-zinc-400">Let your group vote on their favorite activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {!showSuccess ? (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <p className="text-sm text-zinc-300 mb-2 font-medium">Activities to vote on:</p>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-zinc-400">{activity.title}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500">€{activity.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title" className="text-sm font-medium text-zinc-300">
                    Event Title <span className="text-zinc-600">(optional)</span>
                  </Label>
                  <Input
                    id="event-title"
                    type="text"
                    placeholder="e.g., Team Offsite 2025, Sarah's Birthday"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizer-name" className="text-sm font-medium text-zinc-300">
                      Your Name <span className="text-zinc-600">(optional)</span>
                    </Label>
                    <Input
                      id="organizer-name"
                      type="text"
                      placeholder="e.g., Alex"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizer-email" className="text-sm font-medium text-zinc-300">
                      Your Email <span className="text-zinc-600">(optional)</span>
                    </Label>
                    <Input
                      id="organizer-email"
                      type="email"
                      placeholder="alex@example.com"
                      value={organizerEmail}
                      onChange={(e) => setOrganizerEmail(e.target.value)}
                      className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="waitlist"
                    checked={joinWaitlist}
                    onChange={(e) => setJoinWaitlist(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-primary/30 bg-black/50 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <Label htmlFor="waitlist" className="text-sm font-medium text-zinc-300 cursor-pointer">
                      Join waitlist for launch updates
                    </Label>
                    <p className="text-xs text-zinc-500 mt-1">Get early access to new features and voting analytics</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">No login required</span> - Anyone with the link can
                    vote. Results are anonymous and shareable.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGenerateLink}
                className="w-full h-12 bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold text-lg"
              >
                Generate Voting Link
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Voting Link Created!</h3>
                <p className="text-zinc-400">Share this link with your group to start voting</p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <Label className="text-xs text-zinc-400 mb-2 block">Your Voting Link</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm text-primary">
                    {votingLink}
                  </div>
                  <Button
                    onClick={handleCopy}
                    className={`shrink-0 ${
                      copied
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-primary/20 text-primary border-primary/30"
                    } border hover:bg-primary/30 transition-all duration-200`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-300">Share via</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleShareEmail}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    onClick={handleShareWhatsApp}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={handleShareSlack}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Slack
                  </Button>
                  <Button
                    onClick={() => setShowQR(!showQR)}
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                </div>
              </div>

              {showQR && (
                <div className="bg-white p-6 rounded-xl flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-48 h-48 bg-zinc-200 rounded-lg flex items-center justify-center mb-3">
                    <QrCode className="w-24 h-24 text-zinc-400" />
                  </div>
                  <p className="text-xs text-zinc-600 text-center">Scan to vote on activities</p>
                  <p className="text-xs text-zinc-400 font-mono mt-1">{votingLink}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                >
                  Create Another
                </Button>
                <Button onClick={onClose} className="flex-1 bg-primary hover:bg-primary/90 text-black font-semibold">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
