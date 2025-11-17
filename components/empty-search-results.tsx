"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, Sparkles } from 'lucide-react'

interface EmptySearchResultsProps {
  location: string
  suggestions: string[]
  budgetHint?: string
  onSelectDestination: (destination: string) => void
}

export function EmptySearchResults({ 
  location, 
  suggestions, 
  budgetHint,
  onSelectDestination 
}: EmptySearchResultsProps) {
  return (
    <div className="relative">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl -z-10" />
      
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 md:p-12 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <MapPin className="w-10 h-10 text-blue-400" />
        </div>
        
        {/* Heading */}
        <h3 className="text-2xl md:text-3xl font-bold mb-3">
          No activities found in {location}
        </h3>
        
        {/* Description */}
        <p className="text-zinc-400 text-lg mb-2">
          We couldn't find activities matching your exact criteria
        </p>
        
        {budgetHint && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">{budgetHint}</span>
          </div>
        )}
        
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-zinc-300">
                Try these popular destinations
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
              {suggestions.map((dest) => (
                <Button
                  key={dest}
                  onClick={() => onSelectDestination(dest)}
                  variant="outline"
                  className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50 hover:scale-105 transition-all duration-300"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {dest}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 mb-3">Quick tips to find activities:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-400">
            <Badge variant="outline" className="bg-zinc-800/30 border-zinc-700/50 py-2">
              Increase your budget
            </Badge>
            <Badge variant="outline" className="bg-zinc-800/30 border-zinc-700/50 py-2">
              Remove date filters
            </Badge>
            <Badge variant="outline" className="bg-zinc-800/30 border-zinc-700/50 py-2">
              Try broader categories
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
