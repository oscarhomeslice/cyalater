/**
 * Viator Search Mapper
 *
 * Transforms user search data into Viator API format
 * Handles budget range calculation, tag mapping, and date ranges
 */

import { VIATOR_QUALITY_TAGS, VIATOR_CATEGORIES } from "@/lib/viator-helper"

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

  for (const activity of inspirationActivities) {
    // Extract tags from activity tags array
    if (activity.tags) {
      for (const tag of activity.tags) {
        const tagLower = tag.toLowerCase()

        if (tagLower.includes("food") || tagLower.includes("culinary")) {
          tags.push(VIATOR_CATEGORIES.FOOD_WINE.id)
        }
        if (tagLower.includes("outdoor") || tagLower.includes("nature")) {
          tags.push(VIATOR_CATEGORIES.OUTDOOR.id)
        }
        if (tagLower.includes("cultural") || tagLower.includes("historic")) {
          tags.push(VIATOR_CATEGORIES.CULTURAL.id)
        }
        if (tagLower.includes("water") || tagLower.includes("beach")) {
          tags.push(VIATOR_CATEGORIES.WATER_ACTIVITIES.id)
        }
        if (tagLower.includes("adventure") || tagLower.includes("sport")) {
          tags.push(VIATOR_CATEGORIES.ADVENTURE.id)
        }
        if (tagLower.includes("workshop") || tagLower.includes("class")) {
          tags.push(VIATOR_CATEGORIES.WORKSHOPS.id)
        }
      }
    }

    // Check activity name for category hints
    const nameLower = activity.name.toLowerCase()
    if (nameLower.includes("food") || nameLower.includes("wine") || nameLower.includes("dining")) {
      tags.push(VIATOR_CATEGORIES.FOOD_WINE.id)
    }
  }

  // Remove duplicates
  return Array.from(new Set(tags))
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
 */
export function mapUserSearchToViatorRequest(
  context: UserSearchContext,
  destinationId: number,
  options?: {
    includeQualityTags?: boolean // Default true
    maxResults?: number // Default 50
    useMinimalFilters?: boolean // NEW: Use minimal filters for broader results
  },
): ViatorSearchRequest {
  const { includeQualityTags = true, maxResults = 50, useMinimalFilters = true } = options || {}

  // Calculate budget range
  const { lowestPrice, highestPrice } = calculateBudgetRange(context.budgetPerPerson)

  // Get date range
  const { startDate, endDate } = getDateRange()

  const tags: number[] = []

  // Only add 1-2 most relevant tags if we have strong signals, otherwise no tags
  if (!useMinimalFilters) {
    // Add quality tags only if explicitly requested
    if (includeQualityTags) {
      tags.push(
        VIATOR_QUALITY_TAGS.TOP_PRODUCT,
        VIATOR_QUALITY_TAGS.EXCELLENT_QUALITY,
        VIATOR_QUALITY_TAGS.BEST_CONVERSION,
      )
    }

    // Add vibe-based tags
    const vibeTags = mapVibeToTags(context.vibe)
    tags.push(...vibeTags)

    // Add inspiration-based tags
    const inspirationTags = mapInspirationToTags(context.inspirationActivities)
    tags.push(...inspirationTags)
  }

  // Remove duplicate tags
  const uniqueTags = Array.from(new Set(tags))

  // Determine sorting - always use rating for better quality
  const sorting = {
    sort: "REVIEW_AVG_RATING_D" as const,
    order: "DESCENDING" as const,
  }

  // Build the request with minimal filters
  const request: ViatorSearchRequest = {
    filtering: {
      destination: destinationId.toString(),
      lowestPrice,
      highestPrice,
      includeAutomaticTranslations: true,
    },
    sorting,
    pagination: {
      start: 1,
      count: Math.min(maxResults, 50), // Viator max is 50
    },
    currency: context.currency,
  }

  // Only add tags if we have any and not using minimal filters
  if (uniqueTags.length > 0 && !useMinimalFilters) {
    request.filtering.tags = uniqueTags
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
