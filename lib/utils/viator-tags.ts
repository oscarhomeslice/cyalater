/**
 * Viator Tags Utility
 *
 * Fetches and caches tag mappings from Viator's /products/tags endpoint
 * Maps app vibes/categories to actual Viator tag IDs
 */

interface ViatorTag {
  tagId: number
  tagName: string
  categoryName: string
  allNamesByLocale?: Record<string, string>
}

interface TagCache {
  tags: ViatorTag[]
  timestamp: number
}

// Cache duration: 30 days (tags rarely change)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000

let tagCache: TagCache | null = null
let initializationPromise: Promise<void> | null = null

const VIATOR_BASE_URL =
  process.env.VIATOR_API_BASE_URL?.replace(/\/partner$/, "") + "/partner" || "https://api.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY

/**
 * Fetch all tags from Viator API
 */
async function fetchViatorTags(): Promise<ViatorTag[]> {
  if (!VIATOR_API_KEY) {
    console.error("[Viator Tags] API key not configured")
    throw new Error("Viator API key is required")
  }

  const endpoint = `${VIATOR_BASE_URL}/products/tags`

  console.log("[Viator Tags] Fetching tags from:", endpoint)

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "exp-api-key": VIATOR_API_KEY,
        "Accept-Language": "en-US",
        Accept: "application/json;version=2.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Viator Tags] API error:", response.status, errorText)
      throw new Error(`Failed to fetch tags: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[Viator Tags] Fetched ${data.tags?.length || 0} tags`)

    return data.tags || []
  } catch (error) {
    console.error("[Viator Tags] Error fetching tags:", error)
    throw error
  }
}

/**
 * Initialize tags cache on app startup
 */
export async function initializeViatorTags(): Promise<void> {
  // Prevent duplicate initialization
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    console.log("[Viator Tags] Initializing tags cache...")

    // Check if cache is still valid
    if (tagCache && Date.now() - tagCache.timestamp < CACHE_DURATION) {
      console.log("[Viator Tags] Using existing valid cache")
      return
    }

    try {
      const tags = await fetchViatorTags()
      tagCache = {
        tags,
        timestamp: Date.now(),
      }
      console.log(`[Viator Tags] Cache initialized with ${tags.length} tags`)
    } catch (error) {
      console.error("[Viator Tags] Failed to initialize:", error)
      // Keep existing cache if available
      if (!tagCache) {
        tagCache = { tags: [], timestamp: Date.now() }
      }
    }
  })()

  return initializationPromise
}

/**
 * Get cached tags (ensures cache is initialized)
 */
async function getCachedTags(): Promise<ViatorTag[]> {
  await initializeViatorTags()
  return tagCache?.tags || []
}

/**
 * Find tag IDs by name pattern (case-insensitive, partial match)
 */
export async function findTagsByName(pattern: string): Promise<number[]> {
  const tags = await getCachedTags()
  const normalizedPattern = pattern.toLowerCase()

  return tags
    .filter(
      (tag) =>
        tag.tagName.toLowerCase().includes(normalizedPattern) ||
        tag.categoryName.toLowerCase().includes(normalizedPattern),
    )
    .map((tag) => tag.tagId)
}

/**
 * Find tag IDs by exact category name
 */
export async function findTagsByCategory(categoryName: string): Promise<number[]> {
  const tags = await getCachedTags()
  const normalizedCategory = categoryName.toLowerCase()

  return tags.filter((tag) => tag.categoryName.toLowerCase() === normalizedCategory).map((tag) => tag.tagId)
}

/**
 * Map app vibe to Viator tag IDs
 */
export async function mapVibeToViatorTags(vibe: string): Promise<number[]> {
  console.log(`[Viator Tags] Mapping vibe: ${vibe}`)

  const vibeMap: Record<string, string[]> = {
    adventurous: ["adventure", "outdoor", "sports", "hiking", "extreme", "adrenaline"],
    relaxed: ["wellness", "spa", "relaxation", "meditation", "yoga", "beach"],
    creative: ["workshop", "class", "art", "craft", "cooking", "photography", "painting"],
    cultural: ["culture", "history", "museum", "heritage", "architecture", "local culture"],
    foodie: ["food", "wine", "culinary", "tasting", "gastronomy", "dining"],
    romantic: ["romantic", "couples", "sunset", "dinner", "private", "luxury"],
    family: ["family", "kids", "children", "family-friendly"],
    nightlife: ["nightlife", "bar", "club", "evening", "night tour"],
    nature: ["nature", "wildlife", "park", "garden", "scenic"],
    shopping: ["shopping", "market", "boutique", "fashion", "souvenir"],
  }

  const searchTerms = vibeMap[vibe.toLowerCase()] || [vibe]
  const tagIds = new Set<number>()

  for (const term of searchTerms) {
    const ids = await findTagsByName(term)
    ids.forEach((id) => tagIds.add(id))
  }

  const result = Array.from(tagIds)
  console.log(`[Viator Tags] Vibe "${vibe}" mapped to ${result.length} tag IDs:`, result)

  return result
}

/**
 * Map activity level to Viator tag IDs
 */
export async function mapActivityLevelToViatorTags(level: string): Promise<number[]> {
  console.log(`[Viator Tags] Mapping activity level: ${level}`)

  const levelMap: Record<string, string[]> = {
    easy: ["easy", "leisurely", "relaxed", "light", "low intensity"],
    moderate: ["moderate", "intermediate", "average fitness"],
    challenging: ["challenging", "strenuous", "difficult", "high fitness", "athletic"],
    extreme: ["extreme", "very strenuous", "expert", "advanced"],
  }

  const searchTerms = levelMap[level.toLowerCase()] || [level]
  const tagIds = new Set<number>()

  for (const term of searchTerms) {
    const ids = await findTagsByName(term)
    ids.forEach((id) => tagIds.add(id))
  }

  const result = Array.from(tagIds)
  console.log(`[Viator Tags] Activity level "${level}" mapped to ${result.length} tag IDs:`, result)

  return result
}

/**
 * Get quality tags that indicate high-quality products
 */
export async function getQualityTags(): Promise<number[]> {
  console.log("[Viator Tags] Fetching quality tags")

  const qualityKeywords = [
    "top",
    "best",
    "excellent",
    "premium",
    "highly rated",
    "top rated",
    "best seller",
    "popular",
    "featured",
    "recommended",
    "award",
    "unique",
    "exclusive",
  ]

  const tagIds = new Set<number>()

  for (const keyword of qualityKeywords) {
    const ids = await findTagsByName(keyword)
    ids.forEach((id) => tagIds.add(id))
  }

  const result = Array.from(tagIds)
  console.log(`[Viator Tags] Found ${result.length} quality tag IDs:`, result)

  return result
}

/**
 * Get all available tag categories
 */
export async function getTagCategories(): Promise<string[]> {
  const tags = await getCachedTags()
  const categories = new Set<string>()

  tags.forEach((tag) => {
    if (tag.categoryName) {
      categories.add(tag.categoryName)
    }
  })

  return Array.from(categories).sort()
}

/**
 * Search for tags with detailed results
 */
export async function searchTags(query: string): Promise<ViatorTag[]> {
  const tags = await getCachedTags()
  const normalizedQuery = query.toLowerCase()

  return tags.filter(
    (tag) =>
      tag.tagName.toLowerCase().includes(normalizedQuery) || tag.categoryName.toLowerCase().includes(normalizedQuery),
  )
}

/**
 * Get tag details by ID
 */
export async function getTagById(tagId: number): Promise<ViatorTag | null> {
  const tags = await getCachedTags()
  return tags.find((tag) => tag.tagId === tagId) || null
}

/**
 * Get human-readable tag name by ID
 */
export async function getTagName(tagId: number): Promise<string | null> {
  const tag = await getTagById(tagId)
  return tag ? tag.tagName : null
}

/**
 * Export cache stats for debugging
 */
export async function getTagCacheStats(): Promise<{
  totalTags: number
  cacheAge: number
  categories: number
}> {
  await initializeViatorTags()

  const categories = await getTagCategories()

  return {
    totalTags: tagCache?.tags.length || 0,
    cacheAge: tagCache ? Date.now() - tagCache.timestamp : 0,
    categories: categories.length,
  }
}
