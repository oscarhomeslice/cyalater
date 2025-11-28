"use client"

import type React from "react"
import { useState } from "react"
import { useActivityForm } from "@/lib/hooks/useActivityForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Sparkles, Wrench, Ticket, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ActivitySearchFormData } from "@/types/activitySearchFormData" // Declare the variable here

export type { ActivitySearchFormData }

interface ActivitySearchFormProps {
  onSubmit: (formData: ActivitySearchFormData) => void
  isLoading?: boolean
}

export function ActivitySearchForm({ onSubmit, isLoading = false }: ActivitySearchFormProps) {
  const { formData, errors, updateField, validate } = useActivityForm()
  const [showAdditionalContext, setShowAdditionalContext] = useState(false)

  const getBudgetGuidance = (budget: string, currency: string): string => {
    const amount = Number.parseFloat(budget)
    if (isNaN(amount)) return ""

    const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"

    if (amount < 30) {
      return `Budget-friendly ideas - expect creative, resourceful suggestions`
    } else if (amount >= 30 && amount < 70) {
      return `Moderate budget - balanced quality and value`
    } else if (amount >= 70 && amount < 150) {
      return `Premium budget - elevated experiences and materials`
    } else {
      return `Luxury budget - unforgettable moments and unique access`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const submissionData: ActivitySearchFormData = {
      groupSize: formData.groupSize,
      budgetPerPerson: formData.budgetPerPerson,
      currency: formData.currency || "EUR",
      location: formData.location || undefined,
      activityCategory: formData.activityCategory,
      vibe: formData.vibe || undefined,
      groupRelationship: formData.groupRelationship || undefined,
      timeOfDay: formData.timeOfDay || undefined,
      indoorOutdoorPreference: formData.indoorOutdoorPreference || undefined,
      accessibilityNeeds: formData.accessibilityNeeds || undefined,
    }

    console.log("[v0] Submitting form data:", submissionData)
    onSubmit(submissionData)
  }

  return (
    <TooltipProvider>
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl hover:border-zinc-700 transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Group Size */}
          <div className="space-y-3">
            <Label htmlFor="group-size" className="text-sm font-medium text-zinc-300">
              Group Size <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.groupSize || ""}
              onValueChange={(value) => updateField("groupSize", value)}
              disabled={isLoading}
            >
              <SelectTrigger
                id="group-size"
                className={`w-full bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12 ${
                  errors.groupSize ? "border-red-500 focus:border-red-500" : ""
                }`}
                aria-invalid={!!errors.groupSize}
              >
                <SelectValue placeholder="Select group size" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="2-5">2-5 people</SelectItem>
                <SelectItem value="6-10">6-10 people</SelectItem>
                <SelectItem value="11-20">11-20 people</SelectItem>
                <SelectItem value="20+">20+ people</SelectItem>
              </SelectContent>
            </Select>
            {errors.groupSize && (
              <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                {errors.groupSize}
              </p>
            )}
          </div>

          {/* Budget per Person */}
          <div className="space-y-3">
            <Label htmlFor="budget" className="text-sm font-medium text-zinc-300">
              Budget per Person <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-3">
              <Select
                value={formData.currency || "EUR"}
                onValueChange={(value) => updateField("currency", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-24 bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="EUR">€</SelectItem>
                  <SelectItem value="USD">$</SelectItem>
                  <SelectItem value="GBP">£</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="budget"
                type="number"
                min="0"
                max="2000"
                value={formData.budgetPerPerson || ""}
                onChange={(e) => updateField("budgetPerPerson", e.target.value)}
                placeholder="e.g., 100"
                disabled={isLoading}
                className={`flex-1 bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12 ${
                  errors.budgetPerPerson ? "border-red-500 focus:border-red-500" : ""
                }`}
                aria-invalid={!!errors.budgetPerPerson}
              />
            </div>
            {formData.budgetPerPerson && !errors.budgetPerPerson && (
              <p className="text-xs text-primary/80 animate-in fade-in slide-in-from-top-1 duration-300">
                {getBudgetGuidance(formData.budgetPerPerson, formData.currency || "EUR")}
              </p>
            )}
            {errors.budgetPerPerson && (
              <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                {errors.budgetPerPerson}
              </p>
            )}
          </div>

          {/* Location (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="location" className="text-sm font-medium text-zinc-300">
                Location <span className="text-zinc-500 text-xs">(optional)</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-400 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 border-zinc-700 text-white max-w-xs">
                  <p className="text-sm">
                    Add a city for culturally-specific ideas, or leave blank for universal activities
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g., Madrid, Barcelona, or leave blank for location-flexible ideas"
              disabled={isLoading}
              className="w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
            />
          </div>

          {/* Activity Category (Required) */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-zinc-300">
              Activity Category <span className="text-red-400">*</span>
            </Label>
            <RadioGroup
              value={formData.activityCategory}
              onValueChange={(value: "diy" | "experience") => updateField("activityCategory", value)}
              disabled={isLoading}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* DIY Option */}
              <Label
                htmlFor="category-diy"
                className={`flex flex-col items-start space-y-2 rounded-xl border-2 p-5 cursor-pointer transition-all duration-300 ${
                  formData.activityCategory === "diy"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-600"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RadioGroupItem value="diy" id="category-diy" className="sr-only" />
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  <span className="font-semibold text-base">DIY</span>
                </div>
                <p className="text-sm text-zinc-400">Organize it yourself with materials and a plan</p>
              </Label>

              {/* Find an Experience Option */}
              <Label
                htmlFor="category-experience"
                className={`flex flex-col items-start space-y-2 rounded-xl border-2 p-5 cursor-pointer transition-all duration-300 ${
                  formData.activityCategory === "experience"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-600"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RadioGroupItem value="experience" id="category-experience" className="sr-only" />
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  <span className="font-semibold text-base">Find an Experience</span>
                </div>
                <p className="text-sm text-zinc-400">Discover bookable activities and guided experiences</p>
              </Label>
            </RadioGroup>
            {errors.activityCategory && (
              <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                {errors.activityCategory}
              </p>
            )}
          </div>

          {/* Additional Context (Collapsible) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdditionalContext(!showAdditionalContext)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-between text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors h-12"
              >
                <span className="text-sm font-medium">Add more details (optional)</span>
                {showAdditionalContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-400 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 border-zinc-700 text-white max-w-xs">
                  <p className="text-sm">Optional details help us suggest more personalized activities</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showAdditionalContext ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-6 pt-2">
                {/* Group Relationship */}
                <div className="space-y-3">
                  <Label htmlFor="group-relationship" className="text-sm font-medium text-zinc-300">
                    Group Relationship
                  </Label>
                  <Select
                    value={formData.groupRelationship || "not-specified"}
                    onValueChange={(value) =>
                      updateField("groupRelationship", value === "not-specified" ? undefined : value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="group-relationship"
                      className="w-full bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="not-specified">Not specified</SelectItem>
                      <SelectItem value="coworkers">Coworkers</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="mixed">Mixed group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time of Day */}
                <div className="space-y-3">
                  <Label htmlFor="time-of-day" className="text-sm font-medium text-zinc-300">
                    Time of Day
                  </Label>
                  <Select
                    value={formData.timeOfDay || "not-specified"}
                    onValueChange={(value) => updateField("timeOfDay", value === "not-specified" ? undefined : value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="time-of-day"
                      className="w-full bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="not-specified">Not specified</SelectItem>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Indoor/Outdoor Preference */}
                <div className="space-y-3">
                  <Label htmlFor="indoor-outdoor" className="text-sm font-medium text-zinc-300">
                    Indoor/Outdoor Preference
                  </Label>
                  <Select
                    value={formData.indoorOutdoorPreference || "not-specified"}
                    onValueChange={(value) =>
                      updateField("indoorOutdoorPreference", value === "not-specified" ? undefined : value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="indoor-outdoor"
                      className="w-full bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="not-specified">Not specified</SelectItem>
                      <SelectItem value="indoor">Indoor only</SelectItem>
                      <SelectItem value="outdoor">Outdoor only</SelectItem>
                      <SelectItem value="no-preference">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Accessibility Needs */}
                <div className="space-y-3">
                  <Label htmlFor="accessibility" className="text-sm font-medium text-zinc-300">
                    Accessibility Needs
                  </Label>
                  <Input
                    id="accessibility"
                    value={formData.accessibilityNeeds || ""}
                    onChange={(e) => updateField("accessibilityNeeds", e.target.value)}
                    placeholder="Any mobility or accessibility requirements?"
                    disabled={isLoading}
                    className="w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
                  />
                </div>

                {/* Vibe (moved to collapsible section) */}
                <div className="space-y-3">
                  <Label htmlFor="vibe" className="text-sm font-medium text-zinc-300">
                    Vibe
                  </Label>
                  <Input
                    id="vibe"
                    value={formData.vibe || ""}
                    onChange={(e) => updateField("vibe", e.target.value)}
                    placeholder="e.g., adventurous, relaxed, creative, competitive"
                    disabled={isLoading}
                    className="w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!formData.groupSize || !formData.budgetPerPerson || !formData.activityCategory || isLoading}
            className={`w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] transition-all duration-500 text-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              formData.groupSize && formData.budgetPerPerson && formData.activityCategory && !isLoading
                ? "hover:bg-[position:100%_0] shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
                : "shadow-primary/10"
            }`}
            aria-label="Get activity inspiration"
          >
            {isLoading ? (
              <>Inspiring...</>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Inspire Me
              </>
            )}
          </Button>
        </form>
      </div>
    </TooltipProvider>
  )
}
