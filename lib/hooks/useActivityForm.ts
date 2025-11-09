"use client"

import { useState, useEffect } from "react"
import type { ActivitySearchForm, FormValidation } from "@/lib/types"
import { getFilteredInspirations, type InspirationPrompt } from "@/lib/data/inspiration-prompts"

export function useActivityForm() {
  const [formData, setFormData] = useState<ActivitySearchForm>({
    groupSize: "",
    budgetPerPerson: undefined,
    currency: "EUR",
    locationMode: "have-location",
    location: "",
    inspirationPrompt: undefined,
    vibe: "",
  })

  const [errors, setErrors] = useState<FormValidation["errors"]>({})

  const [currentInspirations, setCurrentInspirations] = useState<InspirationPrompt[]>([])

  useEffect(() => {
    if (formData.locationMode === "looking-for-ideas") {
      // Get smart suggestions based on current form data
      const inspirations = getFilteredInspirations(
        {
          budget: formData.budgetPerPerson,
          vibe: formData.vibe,
        },
        3,
      )
      setCurrentInspirations(inspirations)
    }
  }, [formData.locationMode, formData.budgetPerPerson])

  const refreshInspirations = () => {
    const inspirations = getFilteredInspirations(
      {
        budget: formData.budgetPerPerson,
        vibe: formData.vibe,
      },
      3,
    )
    setCurrentInspirations(inspirations)
  }

  const updateField = <K extends keyof ActivitySearchForm>(field: K, value: ActivitySearchForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FormValidation["errors"] = {}

    if (!formData.groupSize) {
      newErrors.groupSize = "Please select a group size"
    }

    if (formData.locationMode === "have-location" && !formData.location) {
      newErrors.location = 'Please enter a location or switch to "Looking for ideas"'
    }

    if (formData.locationMode === "looking-for-ideas" && !formData.inspirationPrompt) {
      newErrors.location = "Please select an inspiration or enter your own"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildUserInput = (): string => {
    const parts: string[] = []

    if (formData.groupSize) {
      parts.push(`Group of ${formData.groupSize} people`)
    }

    if (formData.budgetPerPerson) {
      const currencySymbol = formData.currency === "EUR" ? "€" : formData.currency === "GBP" ? "£" : "$"
      parts.push(`${currencySymbol}${formData.budgetPerPerson} per person`)
    }

    if (formData.locationMode === "have-location" && formData.location) {
      parts.push(`in ${formData.location}`)
    } else if (formData.inspirationPrompt) {
      parts.push(formData.inspirationPrompt)
    }

    if (formData.vibe) {
      parts.push(formData.vibe)
    }

    return parts.join(", ")
  }

  return {
    formData,
    errors,
    currentInspirations,
    updateField,
    validate,
    buildUserInput,
    refreshInspirations,
  }
}
