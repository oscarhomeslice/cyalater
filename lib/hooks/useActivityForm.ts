"use client"

import { useState } from "react"
import type { ActivitySearchFormData } from "@/lib/types"
import { validateBudget } from "@/lib/utils/validate-budget"

interface FormErrors {
  groupSize?: string
  budgetPerPerson?: string
  activityCategory?: string
}

export function useActivityForm() {
  const [formData, setFormData] = useState<ActivitySearchFormData>({
    groupSize: "",
    budgetPerPerson: undefined,
    currency: "EUR",
    location: undefined,
    activityCategory: undefined,
    vibe: undefined,
    groupRelationship: undefined,
    timeOfDay: undefined,
    indoorOutdoorPreference: undefined,
    accessibilityNeeds: undefined,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const updateField = <K extends keyof ActivitySearchFormData>(field: K, value: ActivitySearchFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.groupSize) {
      newErrors.groupSize = "Please select a group size"
    }

    if (!formData.budgetPerPerson || formData.budgetPerPerson.trim() === "") {
      newErrors.budgetPerPerson = "Budget is required"
    } else {
      const budgetError = validateBudget(formData.budgetPerPerson)
      if (budgetError) {
        newErrors.budgetPerPerson = budgetError
      }
    }

    if (!formData.activityCategory) {
      newErrors.activityCategory = "Please select an activity category"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const reset = () => {
    setFormData({
      groupSize: "",
      budgetPerPerson: undefined,
      currency: "EUR",
      location: undefined,
      activityCategory: undefined,
      vibe: undefined,
      groupRelationship: undefined,
      timeOfDay: undefined,
      indoorOutdoorPreference: undefined,
      accessibilityNeeds: undefined,
    })
    setErrors({})
  }

  return {
    formData,
    errors,
    updateField,
    validate,
    reset,
  }
}
