"use client"

import { Button } from "@/components/ui/button"
import { ActivityCard, type ActivityData } from "@/components/activity-card"
import { X, ListChecks } from 'lucide-react'

interface ShortlistViewerProps {
  activities: ActivityData[]
  onClose: () => void
  onRemoveFromShortlist: (id: string) => void
}

export function ShortlistViewer({ activities, onClose, onRemoveFromShortlist }: ShortlistViewerProps) {
  if (activities.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <ListChecks className="w-8 h-8 text-zinc-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Your Shortlist is Empty</h3>
              <p className="text-zinc-400">Start adding activities to build your shortlist!</p>
            </div>
            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Back to Results
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Shortlist</h2>
                <p className="text-sm text-zinc-400">{activities.length} {activities.length === 1 ? 'activity' : 'activities'} selected</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id || activity.name}
                activity={activity}
                onAddToShortlist={onRemoveFromShortlist}
                isShortlisted={true}
              />
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-center gap-4 sticky bottom-0 bg-black/80 backdrop-blur-md py-4 border-t border-zinc-800">
            <Button
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              Back to Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
