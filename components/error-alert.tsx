"use client"

import type React from "react"

import { AlertCircle, WifiOff, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"

export type ErrorType =
  | "network"
  | "validation"
  | "tripadvisor"
  | "openai"
  | "ratelimit"
  | "timeout"
  | "empty"
  | "generic"

interface ErrorAlertProps {
  type: ErrorType
  message?: string
  onRetry?: () => void
  onCancel?: () => void
  onKeepWaiting?: () => void
}

const errorConfig: Record<
  ErrorType,
  {
    icon: React.ComponentType<{ className?: string }>
    title: string
    defaultMessage: string
    color: string
  }
> = {
  network: {
    icon: WifiOff,
    title: "Connection Problem",
    defaultMessage: "Check your internet and try again.",
    color: "text-orange-400",
  },
  validation: {
    icon: AlertCircle,
    title: "Missing Information",
    defaultMessage: "Please provide more details about your group activity.",
    color: "text-orange-400",
  },
  tripadvisor: {
    icon: AlertTriangle,
    title: "No Activities Found",
    defaultMessage: "Couldn't find activities for this location. Try another city?",
    color: "text-orange-400",
  },
  openai: {
    icon: AlertCircle,
    title: "AI Service Busy",
    defaultMessage: "Our AI is taking a quick break. Please try again in a moment.",
    color: "text-orange-400",
  },
  ratelimit: {
    icon: TrendingUp,
    title: "Whoa! Slow Down",
    defaultMessage: "Too many requests. Wait 60 seconds and try again.",
    color: "text-red-400",
  },
  timeout: {
    icon: Clock,
    title: "Taking Longer Than Expected",
    defaultMessage: "This is taking a while. You can keep waiting or try again later.",
    color: "text-yellow-400",
  },
  empty: {
    icon: AlertCircle,
    title: "No Activities Found",
    defaultMessage: "Try describing your request differently.",
    color: "text-orange-400",
  },
  generic: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    defaultMessage: "Please try again.",
    color: "text-red-400",
  },
}

export function ErrorAlert({ type, message, onRetry, onCancel, onKeepWaiting }: ErrorAlertProps) {
  const config = errorConfig[type]
  const Icon = config.icon

  return (
    <div className="bg-zinc-900/90 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1">{config.title}</h3>
          <p className="text-zinc-300 text-sm mb-4">{message || config.defaultMessage}</p>

          {type === "empty" && (
            <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 border border-zinc-700">
              <p className="text-xs text-zinc-400 mb-2 font-medium">Suggestions for better results:</p>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                <li>Include your location or city name</li>
                <li>Mention your group size</li>
                <li>Add budget per person</li>
                <li>Describe the vibe or activity type you want</li>
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-semibold"
              >
                Try Again
              </Button>
            )}
            {onKeepWaiting && (
              <Button
                onClick={onKeepWaiting}
                variant="outline"
                className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-primary/50"
              >
                Keep Waiting
              </Button>
            )}
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
