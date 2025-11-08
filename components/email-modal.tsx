"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Mail, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import type { ActivityData } from "./activity-card"
import { showToast } from "./toast"

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  activities: ActivityData[]
}

export function EmailModal({ isOpen, onClose, activities }: EmailModalProps) {
  const [email, setEmail] = useState("")
  const [additionalEmails, setAdditionalEmails] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const handleSend = () => {
    // ============================================
    // 🔧 FUTURE API INTEGRATION POINT
    // ============================================
    // Replace with actual email sending:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     to: email,
    //     cc: additionalEmails.split(',').map(e => e.trim()).filter(Boolean),
    //     activities: activities.map(a => ({
    //       title: a.title,
    //       description: a.description,
    //       cost: a.cost,
    //       duration: a.duration
    //     }))
    //   })
    // })
    // ============================================

    setSent(true)
    showToast("Email sent successfully!", "success")
    setTimeout(() => {
      onClose()
      setSent(false)
      setEmail("")
      setAdditionalEmails("")
    }, 2000)
  }

  const handleReset = () => {
    setSent(false)
    setEmail("")
    setAdditionalEmails("")
    setShowPreview(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center" aria-hidden="true">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="email-modal-title" className="text-2xl font-bold">
                Email These Ideas
              </h2>
              <p className="text-sm text-zinc-400">Send activity suggestions to your inbox</p>
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
          {!sent ? (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-zinc-300 font-medium">
                    {activities.length} {activities.length === 1 ? "activity" : "activities"} selected
                  </p>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    {showPreview ? "Hide" : "Show"} preview
                    {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showPreview && (
                  <div className="space-y-3 pt-3 border-t border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    {activities.map((activity) => (
                      <div key={activity.id} className="bg-black/30 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-1">{activity.title}</h4>
                        <p className="text-xs text-zinc-400 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>€{activity.cost}</span>
                          <span>•</span>
                          <span>{activity.duration}</span>
                          <span>•</span>
                          <span>{activity.activityLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                    Your Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-emails" className="text-sm font-medium text-zinc-300">
                    Additional Recipients <span className="text-zinc-600">(optional)</span>
                  </Label>
                  <Input
                    id="additional-emails"
                    type="text"
                    placeholder="colleague@example.com, friend@example.com"
                    value={additionalEmails}
                    onChange={(e) => setAdditionalEmails(e.target.value)}
                    className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-zinc-500">Separate multiple emails with commas</p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400">
                    We'll send a beautifully formatted email with all activity details, including descriptions, costs,
                    and booking tips.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={!email.trim()}
                className="w-full h-12 bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5 mr-2" />
                Send to My Inbox
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Email Sent!</h3>
              <p className="text-zinc-400">Check your inbox for the activity details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
