/**
 * Viator Search Mapper
 *
 * Transforms user search data into Viator API format
 * Handles budget range calculation, tag mapping, and date ranges
 */

import { VIATOR_CATEGORIES } from "@/lib/viator-helper"

// Input type (from form/search results)
export interface UserSearchContext {
  location: string
  budgetPerPerson: number
  currency: string
  groupSize: string
  vibe?: string
  activityCategory: "diy" | "experience"
  inspirationActivities?: Array<{
    name: string
    tags?: string[]
    activityLevel?: string
    locationType?: string
  }>

  // Additional optional context
  groupRelationship?: string
  timeOfDay?: string
  indoorOutdoor?: string
  accessibilityNeeds?: string
  duration?: string
}

// Output type (Viator search params)
export interface ViatorSearchRequest {
  filtering: {
    destination: string // Viator destination ID as string
    startDate?: string // ISO date
    endDate?: string // ISO date
    lowestPrice?: number
    highestPrice?: number
    tags?: number[] // Viator tag IDs
    includeAutomaticTranslations: boolean
  }
  sorting: {
    sort: "DEFAULT" | "PRICE_FROM_LOW" | "REVIEW_AVG_RATING_D"
    order: "ASCENDING" | "DESCENDING"
  }
  pagination: {
    start: number
    count: number
  }
  currency: string
}

/**
 * Map user vibe to Viator tag IDs
 */
function mapVibeToTags(vibe?: string): number[] {
  if (!vibe) return []

  const vibeLower = vibe.toLowerCase()
  const tags: number[] = []

  // Map common vibes to tag categories
  if (vibeLower.includes("food") || vibeLower.includes("culinary") || vibeLower.includes("wine")) {
    tags.push(VIATOR_CATEGORIES.FOOD_WINE.id)
  }

  if (vibeLower.includes("outdoor") || vibeLower.includes("nature") || vibeLower.includes("hiking")) {
    tags.push(VIATOR_CATEGORIES.OUTDOOR.id)
  }

  if (vibeLower.includes("cultural") || vibeLower.includes("museum") || vibeLower.includes("historic")) {
    tags.push(VIATOR_CATEGORIES.CULTURAL.id)
  }

  if (vibeLower.includes("water") || vibeLower.includes("beach") || vibeLower.includes("boat")) {
    tags.push(VIATOR_CATEGORIES.WATER_ACTIVITIES.id)
  }

  if (vibeLower.includes("adventure") || vibeLower.includes("sport") || vibeLower.includes("active")) {
    tags.push(VIATOR_CATEGORIES.ADVENTURE.id)
  }

  if (vibeLower.includes("workshop") || vibeLower.includes("class") || vibeLower.includes("learn")) {
    tags.push(VIATOR_CATEGORIES.WORKSHOPS.id)
  }

  return tags
}

/**
 * Map inspiration activities to additional tag IDs
 * Enhanced to extract more semantic meaning from AI-generated activities
 */
function mapInspirationToTags(
  inspirationActivities?: Array<{
    name: string
    tags?: string[]
    activityLevel?: string
    locationType?: string
  }>,
): number[] {
  if (!inspirationActivities || inspirationActivities.length === 0) return []

  const tags: number[] = []
  const tagFrequency: Record<number, number> = {}

  for (const activity of inspirationActivities) {
    const searchText = `${activity.name} ${activity.tags?.join(" ") || ""}`.toLowerCase()

    // Map to category IDs with frequency tracking
    const categoryMatches = [
      { keywords: ["food", "culinary", "wine", "tasting", "cooking", "eat"], id: VIATOR_CATEGORIES.FOOD_WINE.id },
      { keywords: ["outdoor", "nature", "hiking", "park", "mountain"], id: VIATOR_CATEGORIES.OUTDOOR.id },
      { keywords: ["cultural", "historic", "museum", "heritage", "tradition"], id: VIATOR_CATEGORIES.CULTURAL.id },
      { keywords: ["water", "beach", "boat", "swim", "kayak", "surf"], id: VIATOR_CATEGORIES.WATER_ACTIVITIES.id },
      { keywords: ["adventure", "sport", "active", "extreme", "thrill"], id: VIATOR_CATEGORIES.ADVENTURE.id },
      { keywords: ["workshop", "class", "learn", "lesson", "course"], id: VIATOR_CATEGORIES.WORKSHOPS.id },
    ]

    categoryMatches.forEach(({ keywords, id }) => {
      const matchCount = keywords.filter((kw) => searchText.includes(kw)).length
      if (matchCount > 0) {
        tagFrequency[id] = (tagFrequency[id] || 0) + matchCount
      }
    })
  }

  // Sort by frequency and take top 3-5 most common themes
  const sortedTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tagId]) => Number.parseInt(tagId))

  console.log("[Viator Mapper] Extracted tags from inspiration:", sortedTags)
  return sortedTags
}

/**
 * Calculate budget range (50% below to 150% above stated budget)
 */
function calculateBudgetRange(budgetPerPerson: number): {
  lowestPrice: number
  highestPrice: number
} {
  const lowestPrice = 0 // Start from 0 to catch all budget options
  const highestPrice = Math.ceil(budgetPerPerson * 2.5) // 250% of budget

  return { lowestPrice, highestPrice }
}

/**
 * Get date range for next 90 days
 */
function getDateRange(): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 90)

  return {
    startDate: today.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  }
}

/**
 * Main mapper function: Transform user search context to Viator API format
 * Enhanced for hybrid filtering approach
 */
export function mapUserSearchToViatorRequest(
  context: UserSearchContext,
  destinationId: number,
  options?: {
    includeQualityTags?: boolean
    maxResults?: number
    useMinimalFilters?: boolean
  },
): ViatorSearchRequest {
  const { includeQualityTags = false, maxResults = 100, useMinimalFilters = true } = options || {}

  // Calculate budget range - wider range for better results
  const { lowestPrice, highestPrice } = calculateBudgetRange(context.budgetPerPerson)

  const tags: number[] = []

  if (context.inspirationActivities && context.inspirationActivities.length > 0) {
    const inspirationTags = mapInspirationToTags(context.inspirationActivities)
    tags.push(...inspirationTags)

    // Add vibe tags if available
    if (context.vibe) {
      const vibeTags = mapVibeToTags(context.vibe)
      tags.push(...vibeTags)
    }
  }

  // Remove duplicate tags
  const uniqueTags = Array.from(new Set(tags))

  console.log("[Viator Mapper] Tags for OR search:", uniqueTags.length > 0 ? uniqueTags : "NONE (cast wide net)")

  // Build the request
  const request: ViatorSearchRequest = {
    filtering: {
      destination: destinationId.toString(),
      lowestPrice,
      highestPrice,
      includeAutomaticTranslations: true,
    },
    sorting: {
      sort: "DEFAULT" as const,
      order: "DESCENDING" as const,
    },
    pagination: {
      start: 1,
      count: Math.min(maxResults, 100), // Request more results for better scoring
    },
    currency: context.currency,
  }

  // Only if we have strong signals from inspiration activities
  if (uniqueTags.length >= 2 && uniqueTags.length <= 7) {
    request.filtering.tags = uniqueTags
    console.log("[Viator Mapper] Using OR logic with", uniqueTags.length, "tags")
  } else {
    console.log("[Viator Mapper] Not using tags - cast wide net strategy")
  }

  return request
}

/**
 * Helper function to log the mapping for debugging
 */
export function logMappingDetails(context: UserSearchContext, request: ViatorSearchRequest): void {
  console.log("[Viator Mapper] ========== MAPPING DETAILS ==========")
  console.log("[Viator Mapper] Input Context:", {
    location: context.location,
    budget: context.budgetPerPerson,
    currency: context.currency,
    groupSize: context.groupSize,
    vibe: context.vibe,
    activityCategory: context.activityCategory,
  })
  console.log("[Viator Mapper] Output Request:", {
    destination: request.filtering.destination,
    priceRange: `${request.filtering.lowestPrice}-${request.filtering.highestPrice}`,
    dateRange: `${request.filtering.startDate} to ${request.filtering.endDate}`,
    tags: request.filtering.tags,
    sort: `${request.sorting.sort} ${request.sorting.order}`,
    count: request.pagination.count,
  })
  console.log("[Viator Mapper] ==========================================")
}

/**
 * Create a simplified version without quality tags (for fallback searches)
 */
export function mapUserSearchToViatorRequestSimplified(
  context: UserSearchContext,
  destinationId: number,
): ViatorSearchRequest {
  return mapUserSearchToViatorRequest(context, destinationId, {
    includeQualityTags: false,
    maxResults: 50,
    useMinimalFilters: true,
  })
}

/**
 * Convenience wrapper that matches the API route's expected interface
 * Transforms search context to Viator parameters with simplified input
 */
export function transformSearchContextToViatorParams(params: {
  destinationId: number
  destinationName: string
  budgetPerPerson?: number
  currency: string
  groupSize: string
  vibe?: string
  inspirationActivities?: Array<{
    name: string
    tags?: string[]
    activityLevel?: string
    locationType?: string
    [key: string]: any
  }>
}) {
  // Build UserSearchContext from simplified params
  const context: UserSearchContext = {
    location: params.destinationName,
    budgetPerPerson: params.budgetPerPerson || 50, // Default budget if not provided
    currency: params.currency,
    groupSize: params.groupSize,
    vibe: params.vibe,
    activityCategory: "experience", // Default to experience
    inspirationActivities: params.inspirationActivities,
  }

  const viatorRequest = mapUserSearchToViatorRequest(context, params.destinationId, {
    includeQualityTags: false, // Don't filter by quality tags
    maxResults: 50,
    useMinimalFilters: true, // Cast wide net
  })

  // Log the mapping for debugging
  logMappingDetails(context, viatorRequest)

  return viatorRequest
}
