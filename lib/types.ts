export interface ParsedQuery {
  location: string
  group_size: string
  budget_per_person: string
  currency: string
  activity_type: string[]
  vibe: string
  duration?: string
}

export interface Activity {
  id?: string
  name: string
  experience: string
  bestFor: string
  cost: string
  duration: string
  locationType: "indoor" | "outdoor" | "hybrid"
  activityLevel: "low" | "moderate" | "high"
  specialElement: string
  preparation: string
  tripAdvisorUrl?: string
  tripAdvisorId?: string
  viatorUrl?: string // Added viatorUrl for bookable activities
  rating?: number
  reviewCount?: number
  tags?: string[]
}

export interface ActivityRecommendation {
  activities: Activity[]
  backupOptions: {
    weatherAlternative: string
    timeSaver: string
    budgetFriendly: string
  }
  refinementPrompts: string[]
  proTips: string[]
}

export interface Shortlist {
  id: string
  unique_link_id: string
  event_title?: string
  organizer_email?: string
  organizer_name?: string
  activities: string[]
  status: string
  created_at: string
  expires_at: string
}

export interface Vote {
  id: string
  shortlist_id: string
  activity_id: string
  voter_name?: string
  voter_identifier: string
  created_at: string
}

export interface EnrichedLocation {
  name: string
  rating: number | null
  reviewCount: number
  tripAdvisorUrl: string
  image: string | null
  category: string
  ranking: string | null
  locationId: string
}

export type LocationMode = "have-location" | "surprise-me" // Updated to match new form options
export type Currency = "EUR" | "USD" | "GBP"

export interface ActivitySearchFormData {
  groupSize: string // Required, not optional
  budgetPerPerson?: string // Optional but recommended
  currency?: string // Optional, defaults to EUR
  locationMode: "have-location" | "surprise-me" // Updated options
  location?: string // Optional, depends on locationMode
  vibe?: string // Optional
}

export interface FormValidation {
  isValid: boolean
  errors: {
    groupSize?: string
    location?: string
    budget?: string
  }
}

export interface InspirationPrompt {
  id: string
  title: string
  description?: string
  location: string
  activityTypes: string[]
  estimatedBudget?: string
  vibe: string
}
