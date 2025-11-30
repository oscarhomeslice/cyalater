/**
 * Viator Response Mapper
 * Transforms Viator API product responses into the app's Activity format
 */

import type { Activity } from "@/lib/types"

// Viator API response interfaces
interface ViatorDuration {
  fixedDurationInMinutes?: number
  variableDurationFromMinutes?: number
  variableDurationToMinutes?: number
}

interface ViatorImage {
  variants: Array<{
    url: string
    width: number
    height: number
  }>
}

interface ViatorReviews {
  combinedAverageRating?: number
  totalReviews?: number
}

interface ViatorPricing {
  summary?: {
    fromPrice?: number
    fromPriceBeforeDiscount?: number
  }
}

interface ViatorCancellationPolicy {
  type?: string
  description?: string
}

interface ViatorBookingSettings {
  confirmationType?: "INSTANT" | "MANUAL"
}

export interface ViatorProduct {
  productCode: string
  title: string
  description?: string
  productUrl?: string
  duration?: ViatorDuration
  images?: ViatorImage[]
  reviews?: ViatorReviews
  pricing?: ViatorPricing
  tags?: number[]
  highlights?: string[]
  cancellationPolicy?: ViatorCancellationPolicy
  bookingConfirmationSettings?: ViatorBookingSettings
  timeZone?: string
  [key: string]: any // Allow for additional fields
}

export interface ScoringBreakdown {
  budgetScore: number
  tagScore: number
  vibeScore: number
  preferencesScore: number
  qualityScore: number
  totalScore: number
}

export interface EnrichmentContext {
  groupSize: string
  vibe?: string
  budgetPerPerson: number
  timeOfDay?: string
  matchedInspirationName?: string
  scoring: ScoringBreakdown
  rating?: number
  reviewCount?: number
}

/**
 * Map Viator duration to readable string format
 */
export function mapDuration(duration?: ViatorDuration): string {
  if (!duration) return "Varies"

  // Fixed duration
  if (duration.fixedDurationInMinutes) {
    const minutes = duration.fixedDurationInMinutes
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    // Handle common durations with readable formats
    if (hours === 0) {
      return `${remainingMinutes}m`
    } else if (remainingMinutes === 0) {
      if (hours === 1) return "1h"
      if (hours === 2) return "2h"
      if (hours === 3) return "3h"
      if (hours >= 4 && hours <= 6) return "Half day"
      if (hours >= 7 && hours <= 10) return "Full day"
      if (hours > 10) return "Multi-day"
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }

  // Variable duration
  if (duration.variableDurationFromMinutes) {
    const fromHours = Math.floor(duration.variableDurationFromMinutes / 60)
    const toHours = duration.variableDurationToMinutes ? Math.floor(duration.variableDurationToMinutes / 60) : undefined

    if (toHours && toHours !== fromHours) {
      return `${fromHours}-${toHours}h`
    }
    return `${fromHours}+ hours`
  }

  return "Varies"
}

/**
 * Select best image from Viator's image array
 * Prioritizes high-resolution images (width >= 1024)
 */
export function selectBestImage(images?: ViatorImage[]): string | undefined {
  if (!images || images.length === 0) return undefined

  // Try to find high-resolution image (width >= 1024)
  for (const img of images) {
    if (img.variants && img.variants.length > 0) {
      const highRes = img.variants.find((v) => v.width >= 1024)
      if (highRes) return highRes.url
    }
  }

  // Fallback to largest available variant
  if (images[0]?.variants && images[0].variants.length > 0) {
    const sorted = [...images[0].variants].sort((a, b) => b.width - a.width)
    return sorted[0].url
  }

  return undefined
}

/**
 * Map Viator tags to location type
 * Based on common Viator outdoor/indoor/venue tag IDs
 */
export function inferLocationType(tags?: number[]): "indoor" | "outdoor" | "hybrid" {
  if (!tags || tags.length === 0) return "hybrid"

  // Known Viator tag IDs (these are examples - adjust based on actual tag mappings)
  const OUTDOOR_TAGS = [
    21909, // Outdoor Activities
    21442, // Water Activities
    21441, // Adventure & Sports
    6115, // Nature & Wildlife
    6173, // Hiking
    6195, // Beach Activities
  ]

  const INDOOR_TAGS = [
    21911, // Food & Wine (often indoor)
    21974, // Museums
    21973, // Art Galleries
    11912, // Classes & Workshops
    6181, // Theater & Shows
  ]

  const outdoorCount = tags.filter((tag) => OUTDOOR_TAGS.includes(tag)).length
  const indoorCount = tags.filter((tag) => INDOOR_TAGS.includes(tag)).length

  if (outdoorCount > 0 && indoorCount > 0) return "hybrid"
  if (outdoorCount > indoorCount) return "outdoor"
  if (indoorCount > outdoorCount) return "indoor"

  return "hybrid"
}

/**
 * Map Viator tags to activity level
 * Based on fitness/physical level indicators
 */
export function inferActivityLevel(tags?: number[]): "low" | "moderate" | "high" {
  if (!tags || tags.length === 0) return "moderate"

  // Known Viator fitness/activity level tag IDs
  const HIGH_ACTIVITY_TAGS = [
    21441, // Adventure & Sports
    6173, // Hiking
    6189, // Climbing
    6116, // Extreme Sports
  ]

  const LOW_ACTIVITY_TAGS = [
    21911, // Food & Wine
    21974, // Museums
    21973, // Art Galleries
    6181, // Theater & Shows
    6212, // Relaxation
  ]

  const hasHighActivity = tags.some((tag) => HIGH_ACTIVITY_TAGS.includes(tag))
  const hasLowActivity = tags.some((tag) => LOW_ACTIVITY_TAGS.includes(tag))

  if (hasHighActivity) return "high"
  if (hasLowActivity) return "low"

  return "moderate"
}

/**
 * Build preparation text from Viator product details
 */
export function buildPreparationText(product: ViatorProduct): string {
  const texts: string[] = []

  // Instant confirmation
  if (product.bookingConfirmationSettings?.confirmationType === "INSTANT") {
    texts.push("Instant confirmation upon booking")
  }

  // Cancellation policy
  if (product.cancellationPolicy?.type === "FREE_CANCELLATION") {
    texts.push("Free cancellation available")
  } else if (product.cancellationPolicy?.description) {
    texts.push("Check cancellation policy before booking")
  }

  // Default fallback
  if (texts.length === 0) {
    return "Review booking details and requirements before purchase"
  }

  return texts.join(". ") + "."
}

/**
 * Extract meaningful tags from Viator tag IDs
 * Maps common Viator tags to readable strings
 */
export function extractReadableTags(viatorTags?: number[]): string[] {
  if (!viatorTags || viatorTags.length === 0) return ["Experience"]

  const TAG_MAP: Record<number, string> = {
    // Quality indicators
    367652: "Top Seller",
    21972: "Excellent Quality",
    22143: "Popular",
    22083: "Likely to Sell Out",
    21971: "Premium Experience",
    6226: "Best Value",

    // Categories
    21911: "Food & Wine",
    21909: "Outdoor",
    21913: "Cultural",
    21442: "Water Activities",
    21441: "Adventure",
    11912: "Workshop",
    21974: "Museum",
    21973: "Art Gallery",
    6115: "Nature & Wildlife",
    6181: "Entertainment",
  }

  const mapped = viatorTags.map((tag) => TAG_MAP[tag]).filter(Boolean)

  // Return up to 4 most relevant tags
  return mapped.length > 0 ? mapped.slice(0, 4) : ["Experience"]
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

/**
 * New function to generate contextual "bestFor" snippets based on scoring
 */
export function generateBestForSnippets(context: EnrichmentContext): string {
  const snippets: string[] = []

  // Always include group size and vibe if provided
  snippets.push(context.groupSize)
  if (context.vibe) {
    snippets.push(context.vibe)
  }

  // Add context based on what scored well
  if (context.scoring.budgetScore >= 20) {
    snippets.push("Great value")
  }

  if (context.scoring.tagScore >= 25 && context.matchedInspirationName) {
    // Shorten the inspiration name if it's too long
    const inspirationName =
      context.matchedInspirationName.length > 30
        ? context.matchedInspirationName.substring(0, 27) + "..."
        : context.matchedInspirationName
    snippets.push(`Similar to ${inspirationName}`)
  }

  if (context.scoring.preferencesScore >= 8 && context.timeOfDay && context.timeOfDay !== "flexible") {
    snippets.push(`Perfect for ${context.timeOfDay}`)
  }

  // Quality indicators - add at the end
  if (context.scoring.qualityScore >= 8 && context.rating && context.reviewCount) {
    const rating = context.rating.toFixed(1)
    const reviewCount = context.reviewCount
    snippets.push(`Top-rated (${rating}/5 from ${reviewCount} reviews)`)
  } else if (context.rating && context.reviewCount) {
    const rating = context.rating.toFixed(1)
    snippets.push(`Rated ${rating}/5 by ${context.reviewCount} travelers`)
  }

  return snippets.join(" • ")
}

/**
 * Main mapper function: Transform Viator product to Activity format
 */
export function mapViatorProductToActivity(
  product: ViatorProduct,
  currency: string,
  groupSize?: string,
  vibe?: string,
): Activity {
  // Extract pricing
  const price = product.pricing?.summary?.fromPrice || 0

  // Build review text
  const reviewText = product.reviews?.totalReviews
    ? `Rated ${product.reviews.combinedAverageRating}/5 by ${product.reviews.totalReviews} travelers`
    : "New experience"

  // Build "best for" text
  const bestForParts: string[] = []
  if (groupSize) bestForParts.push(`${groupSize} travelers`)
  if (vibe) bestForParts.push(vibe)
  bestForParts.push(reviewText)

  let specialElement = "Unique local experience"
  if (product.highlights && product.highlights.length > 0) {
    // Combine up to 3 highlights into a compelling description
    const topHighlights = product.highlights.slice(0, 3)
    if (topHighlights.length === 1) {
      specialElement = topHighlights[0]
    } else if (topHighlights.length === 2) {
      specialElement = `${topHighlights[0]} and ${topHighlights[1].toLowerCase()}`
    } else {
      specialElement = `${topHighlights[0]}, ${topHighlights[1].toLowerCase()}, and ${topHighlights[2].toLowerCase()}`
    }
  }

  return {
    id: product.productCode,
    name: product.title,
    experience: truncateText(product.description, 200),
    bestFor: bestForParts.length > 0 ? bestForParts.join(" • ") : "Great for all travelers",
    cost: `${currency}${price}`,
    duration: mapDuration(product.duration),
    locationType: inferLocationType(product.tags),
    activityLevel: inferActivityLevel(product.tags),
    specialElement: specialElement,
    preparation: buildPreparationText(product),
    viatorUrl: product.productUrl,
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
    tags: extractReadableTags(product.tags),
    image: selectBestImage(product.images),
    highlights: product.highlights, // Add highlights array to activity object so it's available for enrichment
  }
}

/**
 * Batch mapper: Transform array of Viator products to Activity array
 */
export function mapViatorProductsToActivities(
  products: ViatorProduct[],
  currency: string,
  groupSize?: string,
  vibe?: string,
): Activity[] {
  return products.map((product) => mapViatorProductToActivity(product, currency, groupSize, vibe))
}
