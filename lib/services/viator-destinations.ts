// Viator Destinations Service
// Fetches and caches ALL destinations from Viator's API with fuzzy matching

const VIATOR_BASE_URL = process.env.VIATOR_API_BASE_URL || "https://api.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
let destinationsCache: ViatorDestination[] = []
let cacheTimestamp = 0
let initializationPromise: Promise<void> | null = null

// Interfaces
export interface ViatorDestination {
  destinationId: number
  destinationName: string
  destinationType: string
  parentId?: number
}

export interface DestinationMatch {
  destinationId: number
  destinationName: string
  destinationType: string
  matchConfidence: "exact" | "partial" | "fuzzy"
}

const DESTINATIONS_ENDPOINT = `${VIATOR_BASE_URL}/destinations`

// API Headers
function getHeaders(): HeadersInit {
  if (!VIATOR_API_KEY) {
    throw new Error("VIATOR_API_KEY environment variable is not set")
  }

  return {
    "exp-api-key": VIATOR_API_KEY,
    "Accept-Language": "en-US",
    Accept: "application/json;version=2.0",
  }
}

/**
 * Normalize text for comparison by removing accents and converting to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .trim()
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a score from 0 to 1, where 1 is identical
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1)
  const s2 = normalizeText(str2)

  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  const distance = matrix[s2.length][s1.length]
  const maxLength = Math.max(s1.length, s2.length)
  return 1 - distance / maxLength
}

/**
 * Initialize destinations cache by fetching from Viator API
 * This should be called on app startup
 */
export async function initializeDestinations(): Promise<void> {
  console.log("[Viator Destinations] ===== INITIALIZATION START =====")

  // Return existing initialization promise if already in progress
  if (initializationPromise) {
    console.log("[Viator Destinations] Already initializing, returning existing promise")
    return initializationPromise
  }

  // Check if cache is still valid
  const now = Date.now()
  if (destinationsCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[Viator Destinations] Cache already valid with", destinationsCache.length, "destinations")
    return Promise.resolve()
  }

  if (!VIATOR_API_KEY) {
    const error = new Error("VIATOR_API_KEY environment variable is not set - cannot initialize destinations")
    console.error("[Viator Destinations] CRITICAL ERROR:", error.message)
    throw error
  }
  console.log("[Viator Destinations] API key is present")

  // Create new initialization promise
  initializationPromise = (async () => {
    console.log("[Viator Destinations] Fetching all destinations from:", DESTINATIONS_ENDPOINT)
    console.log("[Viator Destinations] Using API key starting with:", VIATOR_API_KEY.substring(0, 10) + "...")

    try {
      console.log("[Viator Destinations] Making fetch request...")
      const response = await fetch(DESTINATIONS_ENDPOINT, {
        method: "GET",
        headers: getHeaders(),
      })

      console.log("[Viator Destinations] Response received - status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Viator Destinations] API Error ${response.status}:`, errorText)
        throw new Error(`Viator API responded with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log("[Viator Destinations] Raw API response type:", typeof data)
      console.log("[Viator Destinations] Is array:", Array.isArray(data))

      let destinations: any[] = []

      if (Array.isArray(data)) {
        console.log("[Viator Destinations] Response is a direct array")
        destinations = data
      } else if (data.destinations && Array.isArray(data.destinations)) {
        console.log("[Viator Destinations] Response has 'destinations' array")
        destinations = data.destinations
      } else if (data.data && Array.isArray(data.data)) {
        console.log("[Viator Destinations] Response has 'data' array")
        destinations = data.data
      } else {
        console.error("[Viator Destinations] Unexpected response format")
        throw new Error("Unexpected API response format - could not find destinations array")
      }

      console.log(`[Viator Destinations] Extracted ${destinations.length} raw destination records`)

      if (destinations.length > 0) {
        console.log("[Viator Destinations] Sample raw destination:", JSON.stringify(destinations[0], null, 2))
      }

      const validDestinations = destinations
        .filter((d: any) => d && d.destinationId && d.destinationName)
        .map((d: any) => ({
          destinationId: d.destinationId,
          destinationName: d.destinationName,
          destinationType: d.destinationType || d.type || "UNKNOWN",
          parentId: d.parentId || d.lookupId,
        }))

      destinationsCache = validDestinations
      cacheTimestamp = Date.now()

      console.log(`[Viator Destinations] Successfully cached ${destinationsCache.length} destinations`)

      const madridMatch = destinationsCache.find((d) => normalizeText(d.destinationName).includes("madrid"))
      console.log(
        `[Viator Destinations] Madrid in cache: ${madridMatch ? `Yes (${madridMatch.destinationName}, ID: ${madridMatch.destinationId})` : "No"}`,
      )

      const sample = destinationsCache
        .slice(0, 10)
        .map((d) => `${d.destinationName} (${d.destinationType}, ID: ${d.destinationId})`)
      console.log(`[Viator Destinations] First 10 destinations:`, sample)

      console.log("[Viator Destinations] ===== INITIALIZATION COMPLETE =====")
    } catch (error: any) {
      console.error("[Viator Destinations] ===== INITIALIZATION FAILED =====")
      console.error("[Viator Destinations] Error type:", error.constructor?.name)
      console.error("[Viator Destinations] Error message:", error.message)
      console.error("[Viator Destinations] Error stack:", error.stack)
      console.error("[Viator Destinations] =======================================")
      throw error
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Find destination by name with fuzzy matching
 * Returns null if no reasonable match is found
 */
export async function findDestinationByName(name: string): Promise<DestinationMatch | null> {
  // Ensure destinations are loaded
  if (destinationsCache.length === 0) {
    try {
      await initializeDestinations()
    } catch (error) {
      console.error("[Viator Destinations] Could not load destinations:", error)
      return null
    }
  }

  if (!name || name.trim() === "") {
    console.warn("[Viator Destinations] Empty name provided")
    return null
  }

  const normalizedSearch = normalizeText(name)
  console.log(`[Viator Destinations] Searching for: "${name}" (normalized: "${normalizedSearch}")`)

  // Step 1: Try exact match
  let match = destinationsCache.find((d) => normalizeText(d.destinationName) === normalizedSearch)

  if (match) {
    console.log(`[Viator Destinations] Exact match found: ${match.destinationName} (ID: ${match.destinationId})`)
    return {
      destinationId: match.destinationId,
      destinationName: match.destinationName,
      destinationType: match.destinationType,
      matchConfidence: "exact",
    }
  }

  // Step 2: Try partial match (contains)
  match = destinationsCache.find((d) => {
    const normalized = normalizeText(d.destinationName)
    return normalized.includes(normalizedSearch) || normalizedSearch.includes(normalized)
  })

  if (match) {
    console.log(`[Viator Destinations] Partial match found: ${match.destinationName} (ID: ${match.destinationId})`)
    return {
      destinationId: match.destinationId,
      destinationName: match.destinationName,
      destinationType: match.destinationType,
      matchConfidence: "partial",
    }
  }

  // Step 3: Try word-level matching
  const searchWords = normalizedSearch.split(/\s+/)
  match = destinationsCache.find((d) => {
    const nameWords = normalizeText(d.destinationName).split(/\s+/)
    return searchWords.some((searchWord) =>
      nameWords.some((nameWord) => nameWord.includes(searchWord) || searchWord.includes(nameWord)),
    )
  })

  if (match) {
    console.log(`[Viator Destinations] Word-level match found: ${match.destinationName} (ID: ${match.destinationId})`)
    return {
      destinationId: match.destinationId,
      destinationName: match.destinationName,
      destinationType: match.destinationType,
      matchConfidence: "partial",
    }
  }

  // Step 4: Try fuzzy matching (Levenshtein distance)
  // Only consider matches with similarity >= 0.7
  const fuzzyMatches = destinationsCache
    .map((d) => ({
      destination: d,
      similarity: calculateSimilarity(d.destinationName, name),
    }))
    .filter((m) => m.similarity >= 0.7)
    .sort((a, b) => b.similarity - a.similarity)

  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0]
    console.log(
      `[Viator Destinations] Fuzzy match found: ${bestMatch.destination.destinationName} (ID: ${bestMatch.destination.destinationId}) with similarity ${bestMatch.similarity.toFixed(2)}`,
    )
    return {
      destinationId: bestMatch.destination.destinationId,
      destinationName: bestMatch.destination.destinationName,
      destinationType: bestMatch.destination.destinationType,
      matchConfidence: "fuzzy",
    }
  }

  // No match found
  console.warn(`[Viator Destinations] No match found for: "${name}"`)
  const sampleDestinations = destinationsCache
    .slice(0, 10)
    .map((d) => d.destinationName)
    .join(", ")
  console.log(`[Viator Destinations] Sample available destinations:`, sampleDestinations)

  return null
}

/**
 * Get suggested destinations for UI
 * Returns actual destination names from the cache
 */
export async function getSuggestedDestinations(limit = 10): Promise<string[]> {
  // Ensure destinations are loaded
  if (destinationsCache.length === 0) {
    try {
      await initializeDestinations()
    } catch (error) {
      console.error("[Viator Destinations] Could not load destinations:", error)
      return []
    }
  }

  // Prefer cities over other types
  const cities = destinationsCache.filter((d) => d.destinationType === "CITY")
  const countries = destinationsCache.filter((d) => d.destinationType === "COUNTRY")
  const others = destinationsCache.filter((d) => d.destinationType !== "CITY" && d.destinationType !== "COUNTRY")

  // Combine: prioritize cities, then countries, then others
  const suggested = [
    ...cities.slice(0, limit),
    ...countries.slice(0, Math.max(0, limit - cities.length)),
    ...others.slice(0, Math.max(0, limit - cities.length - countries.length)),
  ].slice(0, limit)

  return suggested.map((d) => d.destinationName)
}

/**
 * Get all cached destinations (for debugging or advanced use)
 */
export function getAllDestinations(): ViatorDestination[] {
  return [...destinationsCache]
}

/**
 * Clear the cache (for testing or manual refresh)
 */
export function clearCache(): void {
  destinationsCache = []
  cacheTimestamp = 0
  console.log("[Viator Destinations] Cache cleared")
}
