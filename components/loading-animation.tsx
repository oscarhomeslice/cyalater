"use client"

import { useEffect, useState } from "react"

const loadingMessages = [
  "🎯 Understanding your group...",
  "🌍 Exploring destinations...",
  "✨ Finding creative ideas...",
  "💡 Generating personalized suggestions...",
  "📋 Preparing your activity plan...",
]

export function LoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [messageFade, setMessageFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageFade(false)
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
        setMessageFade(true)
      }, 300)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-emerald-950/20 to-zinc-900 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-8 px-4 max-w-md w-full">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-400/50 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-400/30 animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        <div className="h-16 flex items-center justify-center">
          <p
            className={`text-xl md:text-2xl font-medium text-center transition-opacity duration-300 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent ${
              messageFade ? "opacity-100" : "opacity-0"
            }`}
          >
            {loadingMessages[messageIndex]}
          </p>
        </div>

        <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-pulse"
            style={{
              animation: "progress 10s ease-in-out infinite",
            }}
          />
        </div>

        <p className="text-sm text-zinc-400 animate-pulse">Crafting something special for you...</p>
      </div>
    </div>
  )
}
