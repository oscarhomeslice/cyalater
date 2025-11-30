/**
 * Activity Scoring Utility
 *
 * Scores Viator activities based on user preferences for client-side ranking
 * Part of hybrid filtering strategy: wide server-side net + smart client-side sorting
 */

import type { Activity } from "@/lib/types"
import { calculateInspirationMatchScore } from "./copy-adapter"

interface InspirationActivity {
  name: string
  tags?: string[]
  activityLevel?: string
  locationType?: string
  searchKeywords?: string[]
  reasonItFits?: string
  memorableMoment?: string
}

interface ScoringContext {
  budgetPerPerson: number
  currency: string
  vibe?: string
  inspirationActivities?: InspirationActivity[]
  timeOfDay?: string
  indoorOutdoor?: string
}

interface ActivityToScore {
  id: string
  name: string
  cost: string
  tags?: string[]
  duration?: string
  locationType?: string
  rating?: number
  reviewCount?: number
}

/**
 * Extract numeric price from cost string (e.g., "EUR45" -> 45)
 */
function extractPrice(costString: string): number {
  const match = costString.match(/[\d.]+/)
  return match ? Number.parseFloat(match[0]) : 0
}

/**
 * Score budget match (0-30 points)
 * Closer to user's budget = higher score
 */
function scoreBudgetMatch(activityPrice: number, userBudget: number): number {
  if (activityPrice === 0) return 0

  const percentDiff = Math.abs(activityPrice - userBudget) / userBudget

  if (percentDiff <= 0.1) return 30 // Within 10%
  if (percentDiff <= 0.25) return 25 // Within 25%
  if (percentDiff <= 0.5) return 20 // Within 50%
  if (percentDiff <= 0.75) return 15 // Within 75%
  if (percentDiff <= 1.0) return 10 // Within 100%
  if (percentDiff <= 1.5) return 5 // Within 150%

  return 0 // More than 150% different
}

/**
 * Score tag overlap with inspiration activities (0-40 points)
 */
function scoreTagOverlap(activityTags: string[], inspirationActivities?: InspirationActivity[]): number {
  if (!inspirationActivities || inspirationActivities.length === 0) return 20 // Neutral score

  // Collect all tags from inspiration activities
  const inspirationTags = new Set<string>()
  inspirationActivities.forEach((activity) => {
    activity.tags?.forEach((tag) => inspirationTags.add(tag.toLowerCase()))
  })

  if (inspirationTags.size === 0) return 20 // Neutral if no inspiration tags

  // Count overlapping tags
  const activityTagsLower = activityTags.map((t) => t.toLowerCase())
  let matchCount = 0

  activityTagsLower.forEach((tag) => {
    if (inspirationTags.has(tag)) matchCount++
  })

  // Also check partial matches in activity/inspiration names
  inspirationActivities.forEach((inspiration) => {
    const nameLower = inspiration.name.toLowerCase()
    activityTagsLower.forEach((tag) => {
      if (nameLower.includes(tag) || tag.includes(nameLower.split(" ")[0])) {
        matchCount += 0.5 // Partial match worth half
      }
    })
  })

  // Score based on match percentage
  const matchRatio = matchCount / Math.min(activityTagsLower.length, inspirationTags.size)

  if (matchRatio >= 0.5) return 40 // 50%+ overlap
  if (matchRatio >= 0.3) return 30 // 30%+ overlap
  if (matchRatio >= 0.15) return 20 // 15%+ overlap

  return 10 // Some tags but low overlap
}

/**
 * Score vibe alignment (0-20 points)
 * Maps vibe to expected activity characteristics
 */
function scoreVibeAlignment(activity: ActivityToScore, vibe?: string): number {
  if (!vibe) return 10 // Neutral score

  const vibeLower = vibe.toLowerCase()
  const nameLower = activity.name.toLowerCase()
  const tagsLower = activity.tags?.map((t) => t.toLowerCase()) || []
  const allText = [nameLower, ...tagsLower].join(" ")

  // Vibe keyword matching
  const vibeKeywords: Record<string, string[]> = {
    adventurous: ["adventure", "extreme", "adrenaline", "thrill", "zip", "climb", "dive"],
    relaxed: ["relax", "leisure", "calm", "peaceful", "spa", "wellness", "sunset"],
    creative: ["workshop", "class", "art", "craft", "create", "make", "diy", "cooking"],
    cultural: ["culture", "history", "museum", "heritage", "traditional", "local", "historic"],
    foodie: ["food", "wine", "culinary", "tasting", "gastronomy", "dining", "cuisine"],
    romantic: ["romantic", "couples", "private", "intimate", "sunset", "luxury"],
    family: ["family", "kids", "children", "friendly"],
    nightlife: ["night", "evening", "bar", "club", "nightlife"],
    nature: ["nature", "wildlife", "park", "garden", "outdoor", "scenic"],
  }

  const keywords = vibeKeywords[vibeLower] || [vibeLower]
  let matchCount = 0

  keywords.forEach((keyword) => {
    if (allText.includes(keyword)) matchCount++
  })

  if (matchCount >= 3) return 20
  if (matchCount >= 2) return 15
  if (matchCount >= 1) return 10

  return 5 // No strong vibe match
}

/**
 * Score user preferences (0-10 points)
 * Time of day, indoor/outdoor, etc.
 */
function scorePreferences(activity: ActivityToScore, context: ScoringContext): number {
  let score = 5 // Start neutral

  // Time of day preference
  if (context.timeOfDay && context.timeOfDay !== "flexible") {
    const nameLower = activity.name.toLowerCase()
    const timeKeywords: Record<string, string[]> = {
      morning: ["morning", "sunrise", "breakfast", "early"],
      afternoon: ["afternoon", "lunch", "midday"],
      evening: ["evening", "sunset", "dinner", "night"],
      night: ["night", "nighttime", "late"],
    }

    const keywords = timeKeywords[context.timeOfDay.toLowerCase()] || []
    if (keywords.some((k) => nameLower.includes(k))) score += 3
  }

  // Indoor/outdoor preference
  if (context.indoorOutdoor && activity.locationType) {
    if (context.indoorOutdoor.toLowerCase() === activity.locationType.toLowerCase()) {
      score += 2
    }
  }

  return Math.min(score, 10)
}

/**
 * Bonus points for quality indicators (0-10 points)
 */
function scoreQualityIndicators(activity: ActivityToScore): number {
  let score = 0

  // High rating bonus
  if (activity.rating) {
    if (activity.rating >= 4.8) score += 5
    else if (activity.rating >= 4.5) score += 3
    else if (activity.rating >= 4.0) score += 1
  }

  // Review count bonus (social proof)
  if (activity.reviewCount) {
    if (activity.reviewCount >= 1000) score += 3
    else if (activity.reviewCount >= 500) score += 2
    else if (activity.reviewCount >= 100) score += 1
  }

  return Math.min(score, 10)
}

export interface ScoringBreakdown {
  budgetScore: number
  tagScore: number
  vibeScore: number
  preferencesScore: number
  qualityScore: number
  totalScore: number
}

export interface ScoredActivityResult {
  score: number
  scoring: ScoringBreakdown
  bestInspirationMatch: InspirationActivity | null
  matchScore: number
}

/**
 * Main scoring function
 * Returns score 0-100 (higher = more relevant)
 */
export function scoreActivity(activity: ActivityToScore, context: ScoringContext): number {
  const activityPrice = extractPrice(activity.cost)

  const budgetScore = scoreBudgetMatch(activityPrice, context.budgetPerPerson)
  const tagScore = scoreTagOverlap(activity.tags || [], context.inspirationActivities)
  const vibeScore = scoreVibeAlignment(activity, context.vibe)
  const preferencesScore = scorePreferences(activity, context)
  const qualityScore = scoreQualityIndicators(activity)

  const totalScore = budgetScore + tagScore + vibeScore + preferencesScore + qualityScore

  console.log(
    `[Activity Scorer] ${activity.name}: ${totalScore}/110 (budget: ${budgetScore}, tags: ${tagScore}, vibe: ${vibeScore}, prefs: ${preferencesScore}, quality: ${qualityScore})`,
  )

  return Math.min(totalScore, 100)
}

/**
 * Score activity and find best inspiration match
 * Returns detailed scoring breakdown plus the best matching inspiration activity
 */
export function scoreActivityWithMatch(activity: ActivityToScore, context: ScoringContext): ScoredActivityResult {
  const activityPrice = extractPrice(activity.cost)

  const budgetScore = scoreBudgetMatch(activityPrice, context.budgetPerPerson)
  const tagScore = scoreTagOverlap(activity.tags || [], context.inspirationActivities)
  const vibeScore = scoreVibeAlignment(activity, context.vibe)
  const preferencesScore = scorePreferences(activity, context)
  const qualityScore = scoreQualityIndicators(activity)

  const totalScore = budgetScore + tagScore + vibeScore + preferencesScore + qualityScore

  let bestMatch: InspirationActivity | null = null
  let bestMatchScore = 0

  if (context.inspirationActivities && context.inspirationActivities.length > 0) {
    for (const inspiration of context.inspirationActivities) {
      const matchScore = calculateInspirationMatchScore(
        {
          name: activity.name,
          tags: activity.tags,
          description: "", // Could add description if available
        },
        inspiration as Activity,
      )

      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore
        bestMatch = inspiration
      }
    }
  }

  return {
    score: Math.min(totalScore, 100),
    scoring: {
      budgetScore,
      tagScore,
      vibeScore,
      preferencesScore,
      qualityScore,
      totalScore: Math.min(totalScore, 100),
    },
    bestInspirationMatch: bestMatch,
    matchScore: bestMatchScore,
  }
}

/**
 * Score and sort array of activities
 */
export function scoreAndSortActivities<T extends ActivityToScore>(
  activities: T[],
  context: ScoringContext,
): Array<
  T & {
    relevanceScore: number
    scoringBreakdown: ScoringBreakdown
    bestInspirationMatch: InspirationActivity | null
    matchScore: number
  }
> {
  console.log(`[Activity Scorer] Scoring ${activities.length} activities...`)

  const scored = activities.map((activity) => {
    const result = scoreActivityWithMatch(activity, context)
    return {
      ...activity,
      relevanceScore: result.score,
      scoringBreakdown: result.scoring,
      bestInspirationMatch: result.bestInspirationMatch,
      matchScore: result.matchScore,
    }
  })

  // Sort by score descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore)

  console.log(
    `[Activity Scorer] Top 5 activities:`,
    scored.slice(0, 5).map((a) => ({
      name: a.name,
      score: a.relevanceScore,
      cost: a.cost,
      matchedInspiration: a.bestInspirationMatch?.name,
      matchScore: a.matchScore,
    })),
  )

  return scored
}
