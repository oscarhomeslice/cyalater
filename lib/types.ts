export interface ParsedQuery {
  location: string
  group_size: string
  budget_per_person: string
  currency: string
  activity_type: string[]
  vibe: string
  duration?: string
  activity_category?: string
  group_relationship?: string
  time_of_day?: string
  indoor_outdoor?: string
  accessibility_needs?: string
  enriched?: any
  variety_seed?: any
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
  groupSize: string // Required
  budgetPerPerson?: string // Required but made optional in interface for partial form states
  currency?: string // Optional, defaults to EUR
  location?: string // Optional - simplified from locationMode
  vibe?: string // Optional, moved to collapsible section
  activityCategory?: "diy" | "experience" // Required - new field replacing locationMode

  // New optional fields in collapsible section
  groupRelationship?: string
  timeOfDay?: string
  indoorOutdoorPreference?: string
  accessibilityNeeds?: string
}

export interface SearchContext {
  location: string
  budgetPerPerson: number
  currency: string
  groupSize: string
  vibe?: string
  activityCategory?: string
  inspirationActivities: Activity[]
}

export interface DestinationSuggestion {
  name: string
  message?: string
}

export interface EnrichedUserContext {
  // Original inputs
  groupSize: string
  budgetPerPerson: number
  currency: string
  location?: string
  activityCategory: "diy" | "experience"

  // Optional context
  groupRelationship?: string
  timeOfDay?: string
  indoorOutdoor?: string
  accessibilityNeeds?: string
  vibe?: string

  // Derived insights
  budgetTier: "budget" | "moderate" | "premium" | "luxury"
  groupSizeCategory: "intimate" | "small" | "medium" | "large"
  seasonalContext?: string // derived from current date
}

export interface FormValidation {
  isValid: boolean
  errors: {
    groupSize?: string
    location?: string
    budget?: string
    activityCategory?: string // Added activityCategory to errors
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
