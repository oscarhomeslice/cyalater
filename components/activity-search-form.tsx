"use client"

import type React from "react"
import { useState } from "react"
import { useActivityForm } from "@/lib/hooks/useActivityForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, MapPin, Sparkles } from 'lucide-react'

export interface ActivitySearchFormData {
  groupSize: string
  budgetPerPerson?: string
  currency?: string
  locationMode: "have-location" | "surprise-me"
  location?: string
  vibe?: string
  category?: string
}

interface ActivitySearchFormProps {
  onSubmit: (formData: ActivitySearchFormData) => void
  isLoading?: boolean
}

export function ActivitySearchForm({ onSubmit, isLoading = false }: ActivitySearchFormProps) {
  const { formData, errors, currentInspirations, updateField, validate, refreshInspirations, reset } = useActivityForm()
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const submissionData: ActivitySearchFormData = {
      groupSize: formData.groupSize,
      budgetPerPerson: formData.budgetPerPerson || undefined,
      currency: formData.currency || "EUR",
      locationMode: formData.locationMode as "have-location" | "surprise-me",
      location: formData.locationMode === "have-location" ? formData.location : undefined,
      vibe: formData.vibe || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
    }

    console.log("[v0] Submitting form data:", submissionData)
    onSubmit(submissionData)
  }

  return (
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
              <SelectItem value="2-5 people">2-5 people</SelectItem>
              <SelectItem value="6-10 people">6-10 people</SelectItem>
              <SelectItem value="11-20 people">11-20 people</SelectItem>
              <SelectItem value="20+ people">20+ people</SelectItem>
            </SelectContent>
          </Select>
          {errors.groupSize && (
            <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3 h-3" />
              {errors.groupSize}
            </p>
          )}
        </div>

        {/* Budget */}
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
          {errors.budgetPerPerson && (
            <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3 h-3" />
              {errors.budgetPerPerson}
            </p>
          )}
        </div>

        {/* Location Mode */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-zinc-300">Location</Label>
          <RadioGroup
            value={formData.locationMode}
            onValueChange={(value) => updateField("locationMode", value as "have-location" | "surprise-me")}
            disabled={isLoading}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="location-have"
              className={`flex items-center justify-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                formData.locationMode === "have-location"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-600"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RadioGroupItem value="have-location" id="location-have" className="sr-only" />
              <MapPin className="w-4 h-4" />
              <span className="font-medium">I have a location in mind</span>
            </Label>
            <Label
              htmlFor="location-surprise"
              className={`flex items-center justify-center space-x-2 rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                formData.locationMode === "surprise-me"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-600"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RadioGroupItem value="surprise-me" id="location-surprise" className="sr-only" />
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Surprise me</span>
            </Label>
          </RadioGroup>

          {/* Location Input - only shows when "have location" is selected */}
          {formData.locationMode === "have-location" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input
                id="location-input"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g., Berlin, Paris, or Virtual"
                disabled={isLoading}
                className={`w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12 ${
                  errors.location ? "border-red-500 focus:border-red-500" : ""
                }`}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <p className="text-sm text-red-400 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.location}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Activity Category selector */}
        <div className="space-y-3">
          <Label htmlFor="category" className="text-sm font-medium text-zinc-300">
            Activity Type <span className="text-zinc-500 text-xs">(optional)</span>
          </Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            disabled={isLoading}
          >
            <SelectTrigger
              id="category"
              className="w-full bg-black/50 border-zinc-700 text-white hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
            >
              <SelectValue placeholder="All activities" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="food-wine">🍷 Food & Wine</SelectItem>
              <SelectItem value="outdoor">🏔️ Outdoor Adventures</SelectItem>
              <SelectItem value="cultural">🎭 Cultural Experiences</SelectItem>
              <SelectItem value="water">🌊 Water Activities</SelectItem>
              <SelectItem value="adventure">⚡ Adventure & Sports</SelectItem>
              <SelectItem value="workshops">🎨 Classes & Workshops</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vibe */}
        <div className="space-y-3">
          <Label htmlFor="vibe" className="text-sm font-medium text-zinc-300">
            What's the vibe? <span className="text-zinc-500 text-xs">(optional)</span>
          </Label>
          <Input
            id="vibe"
            value={formData.vibe || ""}
            onChange={(e) => updateField("vibe", e.target.value)}
            placeholder="e.g., adventurous, relaxing, team bonding"
            disabled={isLoading}
            className="w-full bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-primary/50 focus:border-primary transition-all duration-300 h-12"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!formData.groupSize || !formData.budgetPerPerson || isLoading}
          className={`w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_100%] transition-all duration-500 text-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            formData.groupSize && formData.budgetPerPerson && !isLoading
              ? "hover:bg-[position:100%_0] shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black animate-glow-pulse"
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
  )
}
