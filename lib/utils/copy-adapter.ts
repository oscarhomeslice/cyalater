/**
 * Copy Adapter Utility
 *
 * Adapts AI-generated reasoning from inspiration activities to match real Viator product features
 * Part of Phase 3: Adaptive Copy Matching
 */

import type { Activity } from "@/lib/types"

export interface AdaptationContext {
  userGroupSize: string
  userVibe?: string
  userBudget: number
  viatorRating?: number
  viatorReviewCount?: number
  viatorHighlights: string[]
  viatorTags: string[]
  viatorName: string
}

/**
 * Adapts AI-generated "reasonItFits" to match real Viator product features
 * Blends the why from inspiration with the what from Viator
 */
export function adaptReasonItFits(inspirationReason: string, viatorContext: AdaptationContext): string {
  if (!inspirationReason) return ""

  // Extract key motivation words from inspiration
  const motivations = extractMotivations(inspirationReason)

  // Find matching Viator features
  const matchingFeatures = findMatchingFeatures(motivations, viatorContext.viatorHighlights, viatorContext.viatorTags)

  let adapted = inspirationReason

  // If we found matching features, weave them in
  if (matchingFeatures.length > 0) {
    const topFeature = matchingFeatures[0]

    // Try to inject the real feature into the reasoning
    // Example: "Perfect for adventurous friends" -> "Perfect for adventurous friends – this experience includes zip-lining"
    const perfectForMatch = adapted.match(/Perfect for ([^–\n.]+)/i)
    if (perfectForMatch) {
      const whatPart = perfectForMatch[1].trim()
      adapted = `Perfect for ${whatPart} – this experience includes ${topFeature.toLowerCase()}`

      // Add the rest of the original reasoning if there was more
      const restMatch = inspirationReason.match(/Perfect for [^–\n.]+[–.](.+)$/i)
      if (restMatch) {
        adapted += ` and ${restMatch[1].trim()}`
      }
    }
  }

  // Add quality signal if highly rated
  if (
    viatorContext.viatorRating &&
    viatorContext.viatorRating >= 4.7 &&
    viatorContext.viatorReviewCount &&
    viatorContext.viatorReviewCount >= 500
  ) {
    adapted += ` – verified by ${viatorContext.viatorReviewCount}+ travelers`
  }

  return adapted
}

/**
 * Blends AI memorable moment with real Viator highlights
 * Creates a vivid description using actual product features
 */
export function blendMemorableMoment(
  inspirationMoment: string,
  viatorHighlights: string[],
  viatorContext: AdaptationContext,
): string {
  console.log("[v0 Copy Adapter] blendMemorableMoment called with:")
  console.log("  - inspirationMoment:", inspirationMoment)
  console.log("  - viatorHighlights:", viatorHighlights)
  console.log("  - viatorName:", viatorContext.viatorName)

  if (!inspirationMoment) {
    console.log("[v0 Copy Adapter] No inspiration moment provided, returning empty")
    return ""
  }

  // If Viator has no highlights, return inspiration moment as-is
  if (!viatorHighlights || viatorHighlights.length === 0) {
    console.log("[v0 Copy Adapter] No Viator highlights, using inspiration moment as-is")
    return inspirationMoment
  }

  // Extract the core memorable element from inspiration
  const coreElement = extractCoreElement(inspirationMoment)
  console.log("[v0 Copy Adapter] Extracted core element:", coreElement)

  // Find best matching Viator highlight
  const bestMatch = findBestMatchingHighlight(coreElement, viatorHighlights)
  console.log("[v0 Copy Adapter] Best matching highlight:", bestMatch)

  if (bestMatch) {
    // Replace generic element with specific Viator feature
    const replaced = inspirationMoment.replace(new RegExp(coreElement, "gi"), bestMatch.toLowerCase())
    console.log("[v0 Copy Adapter] Replaced result:", replaced)
    return replaced
  }

  // If no semantic match, combine inspiration theme + top Viator highlights
  const topHighlights = viatorHighlights.slice(0, 2).join(" and ")
  const theme = extractTheme(inspirationMoment)
  console.log("[v0 Copy Adapter] Theme extracted:", theme)
  console.log("[v0 Copy Adapter] Top highlights:", topHighlights)

  if (theme) {
    const result = `Experience ${topHighlights} ${theme}`
    console.log("[v0 Copy Adapter] Final result with theme:", result)
    return result
  }

  const genericHighlights = ["unique local experience", "authentic experience", "local experience", "unique experience"]
  const isGeneric = viatorHighlights.every((h) => genericHighlights.some((g) => h.toLowerCase().includes(g)))

  if (isGeneric) {
    console.log("[v0 Copy Adapter] Highlights are too generic, using inspiration moment")
    return inspirationMoment
  }

  // Fallback: use top 3 highlights but format nicely
  const result = viatorHighlights.slice(0, 3).join(", ")
  console.log("[v0 Copy Adapter] Final fallback result:", result)
  return result
}

/**
 * Extract motivation keywords from reasoning text
 */
function extractMotivations(reason: string): string[] {
  const motivationWords = [
    "adventurous",
    "cultural",
    "hands-on",
    "authentic",
    "unique",
    "romantic",
    "couples",
    "intimate",
    "family-friendly",
    "active",
    "relaxing",
    "educational",
    "creative",
    "foodie",
    "culinary",
    "nature",
    "wildlife",
    "historic",
    "traditional",
    "local",
    "luxury",
    "budget",
    "thrilling",
    "peaceful",
    "social",
  ]

  const reasonLower = reason.toLowerCase()
  return motivationWords.filter((word) => reasonLower.includes(word))
}

/**
 * Find Viator features that match motivation keywords
 */
function findMatchingFeatures(motivations: string[], highlights: string[], tags: string[]): string[] {
  const allFeatures = [...highlights, ...tags].filter((f): f is string => typeof f === "string")
  const matches: string[] = []

  for (const motivation of motivations) {
    const match = allFeatures.find(
      (feature) =>
        feature.toLowerCase().includes(motivation) ||
        calculateStringSimilarity(motivation, feature.toLowerCase()) > 0.6,
    )
    if (match && !matches.includes(match)) {
      matches.push(match)
    }
  }

  return matches
}

/**
 * Extract the core action/object from a memorable moment
 * Example: "Watching the sunset from the peak" -> "sunset from the peak"
 */
function extractCoreElement(moment: string): string {
  // Try to find action verbs and what follows
  const actionMatch = moment.match(
    /(?:watching|tasting|experiencing|seeing|learning|discovering|exploring|enjoying)\s+([^while,]+)/i,
  )
  if (actionMatch) {
    return actionMatch[1].trim()
  }

  // Fallback: take first meaningful chunk
  const words = moment.split(" ")
  return words.slice(0, Math.min(5, words.length)).join(" ")
}

/**
 * Find the Viator highlight that best matches a core element
 */
function findBestMatchingHighlight(coreElement: string, highlights: string[]): string | null {
  let bestMatch: string | null = null
  let bestScore = 0

  for (const highlight of highlights) {
    const score = calculateStringSimilarity(coreElement.toLowerCase(), highlight.toLowerCase())
    if (score > bestScore && score > 0.3) {
      bestScore = score
      bestMatch = highlight
    }
  }

  return bestMatch
}

/**
 * Extract thematic ending from a moment description
 * Example: "... while sharing stories with locals" -> "while sharing stories with locals"
 */
function extractTheme(moment: string): string {
  const themeMatch = moment.match(/while\s+(.+)$/i)
  if (themeMatch) {
    return `while ${themeMatch[1]}`
  }

  const asMatch = moment.match(/as\s+(.+)$/i)
  if (asMatch) {
    return `as ${asMatch[1]}`
  }

  return ""
}

/**
 * Calculate Jaccard similarity between two strings
 * Returns 0-1 score based on word overlap
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(
    str1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  const words2 = new Set(
    str2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

  if (words1.size === 0 || words2.size === 0) return 0

  const intersection = new Set([...words1].filter((w) => words2.has(w)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

/**
 * Calculates how well a Viator activity matches an inspiration activity
 * Used to find the best inspiration match for copy adaptation
 */
export function calculateInspirationMatchScore(
  viatorActivity: {
    name: string
    tags?: (string | number)[] // Tags can be strings or numbers (tag IDs)
    description?: string
  },
  inspirationActivity: Activity,
): number {
  let score = 0

  // Check tag overlap (worth up to 40 points)
  if (viatorActivity.tags && inspirationActivity.tags) {
    const viatorTagsLower = viatorActivity.tags
      .filter((t): t is string | number => t !== null && t !== undefined)
      .map((t) => String(t).toLowerCase())
    const inspirationTagsLower = inspirationActivity.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.toLowerCase())

    // Direct tag overlap
    const tagOverlap = viatorTagsLower.filter((t) => inspirationTagsLower.includes(t)).length
    score += tagOverlap * 10

    // Also check partial tag matches (e.g., "workshop" matches "creative workshop")
    let partialMatches = 0
    for (const vTag of viatorTagsLower) {
      for (const iTag of inspirationTagsLower) {
        if (vTag.includes(iTag) || iTag.includes(vTag)) {
          partialMatches += 0.5
        }
      }
    }
    score += partialMatches * 5
  }

  // Check search keyword matching (worth up to 45 points)
  if (inspirationActivity.searchKeywords) {
    const viatorText = `${viatorActivity.name.toLowerCase()} ${viatorActivity.description?.toLowerCase() || ""}`
    const keywordMatches = inspirationActivity.searchKeywords
      .filter((keyword): keyword is string => typeof keyword === "string")
      .filter((keyword) => viatorText.includes(keyword.toLowerCase())).length
    score += keywordMatches * 15
  }

  const activityCategories = {
    food: ["food", "wine", "culinary", "cooking", "tasting", "gastronomy", "dining", "cuisine", "chef"],
    adventure: ["adventure", "adrenaline", "thrill", "extreme", "zip", "climb", "dive", "kayak", "rafting"],
    cultural: ["museum", "gallery", "historic", "heritage", "cultural", "tradition", "temple", "church"],
    nature: ["nature", "wildlife", "park", "garden", "scenic", "mountain", "forest", "beach"],
    creative: ["workshop", "class", "art", "craft", "create", "make", "diy", "painting", "pottery"],
    tour: ["tour", "guided", "walking", "bus", "hop-on", "sightseeing", "city tour"],
  }

  const viatorNameLower = viatorActivity.name.toLowerCase()
  const viatorDescLower = viatorActivity.description?.toLowerCase() || ""
  const inspirationNameLower = inspirationActivity.name.toLowerCase()

  for (const [category, keywords] of Object.entries(activityCategories)) {
    const viatorHasCategory = keywords.some((kw) => viatorNameLower.includes(kw) || viatorDescLower.includes(kw))
    const inspirationHasCategory = keywords.some((kw) => inspirationNameLower.includes(kw))

    if (viatorHasCategory && inspirationHasCategory) {
      score += 15 // Bonus for matching category
    }
  }

  // Check name similarity (worth up to 15 points)
  const nameSimilarity = calculateStringSimilarity(viatorActivity.name, inspirationActivity.name)
  score += nameSimilarity * 15

  return score
}
