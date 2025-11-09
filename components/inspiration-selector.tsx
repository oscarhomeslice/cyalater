"use client"

import { MapPin, DollarSign, Palette, Mountain, Utensils, Users, Sparkle } from "lucide-react"
import type { InspirationPrompt } from "@/lib/types"

interface InspirationSelectorProps {
  inspirations: InspirationPrompt[]
  selectedId?: string
  selectedTitle?: string
  onSelect: (prompt: InspirationPrompt) => void
  onCustomInput: (value: string) => void
  customValue?: string
  disabled?: boolean
}

const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    creative: Palette,
    outdoor: Mountain,
    food: Utensils,
    "team-building": Users,
    default: Sparkle,
  }
  return iconMap[type] || iconMap.default
}

export function InspirationSelector({
  inspirations,
  selectedId,
  selectedTitle,
  onSelect,
  onCustomInput,
  customValue = "",
  disabled = false,
}: InspirationSelectorProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <p className="text-sm text-zinc-400">Choose from these curated ideas:</p>

      {/* Inspiration cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inspirations.map((inspiration) => {
          const Icon = getActivityIcon(inspiration.activityTypes[0])
          const isSelected = selectedId === inspiration.id || selectedTitle === inspiration.title

          return (
            <button
              key={inspiration.id}
              type="button"
              onClick={() => onSelect(inspiration)}
              disabled={disabled}
              className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]"
                  : "border-zinc-700 bg-black/30 hover:border-zinc-600 hover:bg-black/50 hover:shadow-lg hover:scale-[1.02]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Title */}
              <h3
                className={`font-semibold text-base mb-3 leading-tight transition-colors ${
                  isSelected ? "text-primary" : "text-white group-hover:text-zinc-100"
                }`}
              >
                {inspiration.title}
              </h3>

              {/* Location and Budget badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MapPin className="w-3 h-3" />
                  {inspiration.location}
                </span>
                {inspiration.estimatedBudget && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-3 h-3" />
                    {inspiration.estimatedBudget}
                  </span>
                )}
              </div>

              {/* Activity type tags (max 3) */}
              <div className="flex items-center gap-2 flex-wrap">
                {inspiration.activityTypes.slice(0, 3).map((type, index) => {
                  const TypeIcon = getActivityIcon(type)
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
                    >
                      <TypeIcon className="w-3 h-3" />
                      {type}
                    </span>
                  )
                })}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom input option */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900/50 px-3 py-1 text-zinc-500 rounded-full border border-zinc-800">
              Or enter your own idea
            </span>
          </div>
        </div>
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomInput(e.target.value)}
          placeholder="e.g., Coastal retreat with cooking classes"
          disabled={disabled}
          className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
