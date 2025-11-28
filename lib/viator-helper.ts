// Viator API Helper
// Handles all Viator API interactions including destination lookup and product search

const VIATOR_BASE_URL =
  process.env.VIATOR_API_BASE_URL?.replace(/\/partner$/, "") + "/partner" || "https://api.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY

console.log("[Viator] Module loaded with configuration:")
console.log("[Viator] Base URL:", VIATOR_BASE_URL)
console.log("[Viator] API Key present:", !!VIATOR_API_KEY)
console.log("[Viator] API Key length:", VIATOR_API_KEY?.length)
console.log("[Viator] API Key first 8 chars:", VIATOR_API_KEY?.substring(0, 8) + "...")

if (!VIATOR_API_KEY) {
  console.error("[Viator] WARNING: VIATOR_API_KEY environment variable is not set!")
}

const REQUIRED_HEADERS = {
  "exp-api-key": VIATOR_API_KEY!,
  "Accept-Language": "en-US",
  Accept: "application/json;version=2.0",
}

console.log("[Viator] Request headers configured:", {
  hasApiKey: !!REQUIRED_HEADERS["exp-api-key"],
  acceptLanguage: REQUIRED_HEADERS["Accept-Language"],
  accept: REQUIRED_HEADERS["Accept"],
})

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
let destinationsCache: Destination[] = []
let cacheTimestamp = 0

// High-value quality tags from Viator (drive 40% more conversions)
export const VIATOR_QUALITY_TAGS = {
  TOP_PRODUCT: 367652, // Top-selling products
  EXCELLENT_QUALITY: 21972, // Excellent quality rating
  BEST_CONVERSION: 22143, // Highest conversion rate
  LIKELY_SELL_OUT: 22083, // Popular/scarce products
  LOW_SUPPLIER_CANCEL: 367653, // Reliable suppliers
  UNIQUE_EXPERIENCES: 21074, // One-of-a-kind activities
  BEST_VALUE: 6226, // Best price-to-value ratio
  VIATOR_PLUS: 21971, // Premium experiences
}

// Category tags for filtering
export const VIATOR_CATEGORIES = {
  FOOD_WINE: { id: 21911, name: "Food & Wine" },
  OUTDOOR: { id: 21909, name: "Outdoor Activities" },
  CULTURAL: { id: 21913, name: "Cultural Tours" },
  WATER_ACTIVITIES: { id: 21442, name: "Water Activities" },
  ADVENTURE: { id: 21441, name: "Adventure & Sports" },
  WORKSHOPS: { id: 11912, name: "Classes & Workshops" },
}

// Common destinations as fallback when API is unavailable
const COMMON_DESTINATIONS: Destination[] = [
  { destinationId: 684, destinationName: "Malaga", destinationType: "CITY" },
  { destinationId: 682, destinationName: "Málaga", destinationType: "CITY" },
  { destinationId: 706, destinationName: "Barcelona", destinationType: "CITY" },
  { destinationId: 674, destinationName: "Madrid", destinationType: "CITY" },
  { destinationId: 186, destinationName: "Paris", destinationType: "CITY" },
  { destinationId: 179, destinationName: "London", destinationType: "CITY" },
  { destinationId: 684, destinationName: "New York", destinationType: "CITY" },
  { destinationId: 77, destinationName: "Rome", destinationType: "CITY" },
  { destinationId: 2, destinationName: "Amsterdam", destinationType: "CITY" },
  { destinationId: 220, destinationName: "Lisbon", destinationType: "CITY" },
]

// Interfaces
export interface Destination {
  destinationId: number
  destinationName: string
  destinationType: string
  parentId?: number
}

export interface SearchViatorParams {
  destination?: string
  minPrice?: number
  maxPrice?: number
  currency: string
  startDate?: string
  endDate?: string
  count?: number // Max 50 per Viator guidelines
  tags?: number[] // Quality tags for filtering
  categoryTags?: number[] // Category tags for user selection
  confirmationType?: "INSTANT" | "MANUAL"
  freeCancellation?: boolean // Free cancellation filter
  sortOrder?: "DEFAULT" | "PRICE_FROM_LOW" | "REVIEW_AVG_RATING_D" // DEFAULT = featured products
}

export interface ViatorProduct {
  productCode: string
  productName: string
  description: string
  price: number
  currency: string
}

export interface SearchResult {
  products: ViatorProduct[]
  totalCount: number
}

// Helper function to get API headers
function getHeaders(includeContentType = false): HeadersInit {
  if (!VIATOR_API_KEY) {
    console.error(
      "[Viator] VIATOR_API_KEY is not set. Available env vars:",
      Object.keys(process.env).filter((k) => k.includes("VIATOR")),
    )
    throw new Error("Viator API is not configured. Please add VIATOR_API_KEY environment variable.")
  }

  const headers: HeadersInit = {
    "exp-api-key": VIATOR_API_KEY,
    "Accept-Language": "en-US",
    Accept: "application/json;version=2.0",
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json;version=2.0"
  }

  return headers
}

// Fetch all destinations from Viator API
export async function fetchDestinations(): Promise<Destination[]> {
  const now = Date.now()

  // Return cached data if still valid
  if (destinationsCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[Viator] Using cached destinations:", destinationsCache.length)
    return destinationsCache
  }

  const endpoint = `${VIATOR_BASE_URL}/destinations`
  console.log("[Viator] Fetching fresh destinations from API")
  console.log("[Viator] Base URL:", VIATOR_BASE_URL)
  console.log("[Viator] Full endpoint:", endpoint)

  try {
    // Log the request
    logApiRequest(endpoint, "GET", REQUIRED_HEADERS)

    const response = await fetch(endpoint, {
      method: "GET",
      headers: REQUIRED_HEADERS,
    })

    // Get response text first for debugging
    const responseText = await response.text()
    console.log(`[Viator] Raw response status: ${response.status}`)
    console.log(`[Viator] Raw response text (first 500 chars):`, responseText.substring(0, 500))

    if (!response.ok) {
      console.error(`[Viator] Destinations API error: ${response.status}`)
      logApiResponse(endpoint, response.status, response.headers, responseText)

      // Return cached or fallback data
      return destinationsCache.length > 0 ? destinationsCache : COMMON_DESTINATIONS
    }

    // Parse the response
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[Viator] Failed to parse JSON response:", parseError)
      console.error("[Viator] Response text:", responseText)
      return destinationsCache.length > 0 ? destinationsCache : COMMON_DESTINATIONS
    }

    logApiResponse(endpoint, response.status, response.headers, data)

    console.log(`[Viator] Response data structure:`, {
      hasDestinations: !!data.destinations,
      isArray: Array.isArray(data.destinations),
      count: data.destinations?.length,
      totalCount: data.totalCount,
      firstDestinationSample: data.destinations?.[0],
    })

    // Validate and filter destinations
    const rawDestinations = data.destinations || []
    const validDestinations = rawDestinations.filter((d: any, index: number) => {
      const isValid =
        d &&
        typeof d.destinationId === "number" &&
        d.destinationName &&
        typeof d.destinationName === "string" &&
        d.destinationName.trim() !== ""

      if (!isValid && index < 5) {
        console.warn("[Viator] Invalid destination object at index", index, ":", d)
      }

      return isValid
    })

    destinationsCache = validDestinations
    cacheTimestamp = now

    console.log(
      `[Viator] Successfully cached ${destinationsCache.length} valid destinations (from ${rawDestinations.length} raw)`,
    )

    return destinationsCache
  } catch (error: any) {
    console.error("[Viator] Error fetching destinations:", error)
    console.error("[Viator] Error stack:", error.stack)
    // Return cached data even if expired, or fallback
    return destinationsCache.length > 0 ? destinationsCache : COMMON_DESTINATIONS
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .trim()
}

// Find destination ID by location name
export async function findDestinationId(locationName: string): Promise<number | null> {
  if (!locationName || locationName.trim() === "") {
    console.warn("[Viator] Empty location name provided")
    return null
  }

  let destinations = await fetchDestinations()

  if (destinations.length === 0) {
    console.log("[Viator] Using common destinations fallback")
    destinations = COMMON_DESTINATIONS
  }

  const normalizedSearch = normalizeText(locationName)

  console.log(`[Viator] Searching for destination: "${locationName}" (normalized: "${normalizedSearch}")`)
  console.log(`[Viator] Searching through ${destinations.length} destinations`)

  // First try exact match with null safety
  let match = destinations.find((d: any) => {
    const name = d?.destinationName
    if (!name || typeof name !== "string") return false
    return normalizeText(name) === normalizedSearch
  })

  // If no exact match, try partial match with null safety
  if (!match) {
    match = destinations.find((d: any) => {
      const name = d?.destinationName
      if (!name || typeof name !== "string") return false

      const normalized = normalizeText(name)
      return normalized.includes(normalizedSearch) || normalizedSearch.includes(normalized)
    })
  }

  if (!match) {
    match = destinations.find((d: any) => {
      const name = d?.destinationName
      if (!name || typeof name !== "string") return false

      const nameWords = normalizeText(name).split(/\s+/)
      const searchWords = normalizedSearch.split(/\s+/)

      return searchWords.some((searchWord) =>
        nameWords.some((nameWord) => nameWord.includes(searchWord) || searchWord.includes(nameWord)),
      )
    })
  }

  if (match) {
    console.log(`[Viator] Found destination: ${match.destinationName} (ID: ${match.destinationId})`)
    return match.destinationId
  }

  console.warn(`[Viator] No destination found for: "${locationName}"`)
  const sampleDestinations = destinations
    .slice(0, 10)
    .map((d) => d?.destinationName)
    .filter(Boolean)
  console.log(`[Viator] Sample available destinations:`, sampleDestinations.join(", "))

  return null
}

// Get popular destinations for error messages
export async function getPopularDestinations(limit = 10): Promise<string[]> {
  let destinations = await fetchDestinations()

  if (destinations.length === 0) {
    destinations = COMMON_DESTINATIONS
  }

  const validDestinations = destinations.filter(
    (d: any) => d?.destinationName && typeof d.destinationName === "string" && d.destinationName.trim() !== "",
  )

  // Prefer cities, then countries
  const cities = validDestinations.filter((d: any) => d.destinationType === "CITY")
  const countries = validDestinations.filter((d: any) => d.destinationType === "COUNTRY")

  const popular = [
    ...cities.slice(0, Math.min(limit, cities.length)),
    ...countries.slice(0, Math.max(0, limit - cities.length)),
  ].slice(0, limit)

  return popular.map((d: any) => d.destinationName)
}

// Search Viator products
export async function searchViatorProducts(
  params: SearchViatorParams & { destinationId?: number },
): Promise<SearchResult> {
  console.log("====== VIATOR HELPER searchViatorProducts ======")
  console.log("Received params:", JSON.stringify(params, null, 2))
  console.log("VIATOR_BASE_URL:", VIATOR_BASE_URL)
  console.log("Will build endpoint:", `${VIATOR_BASE_URL}/products/search`)
  console.log("===============================================")

  console.log("[Viator] ========== SEARCH PRODUCTS START ==========")
  console.log("[Viator] Input parameters:", JSON.stringify(params, null, 2))

  let destinationId: number | null = params.destinationId || null

  // Convert location name to ID if provided and no ID given
  if (!destinationId && params.destination) {
    console.log(`[Viator] Looking up destination ID for: "${params.destination}"`)
    try {
      destinationId = await findDestinationId(params.destination)

      if (!destinationId) {
        console.error(`[Viator] Destination lookup failed for: "${params.destination}"`)
        const suggestions = await getPopularDestinations(5)
        const errorMessage =
          suggestions.length > 0
            ? `Destination "${params.destination}" not found. Try: ${suggestions.join(", ")}`
            : `Destination "${params.destination}" not found. Please try a different location.`

        throw new Error(errorMessage)
      }

      console.log(`[Viator] Destination ID found: ${destinationId}`)
    } catch (error: any) {
      console.error("[Viator] Error in destination lookup:", error)
      throw error
    }
  }

  const qualityTags = [
    VIATOR_QUALITY_TAGS.TOP_PRODUCT,
    VIATOR_QUALITY_TAGS.EXCELLENT_QUALITY,
    VIATOR_QUALITY_TAGS.BEST_CONVERSION,
  ]

  // Build quality-focused search request
  const requestBody: any = {
    filtering: {
      destination: destinationId?.toString(),
      tags: params.tags || qualityTags, // Use quality tags by default
      includeAutomaticTranslations: true,
    },
    sorting: {
      sort: params.sortOrder || "DEFAULT", // Viator's featured sort (revenue-optimized)
      order: "DESCENDING",
    },
    pagination: {
      start: 1,
      count: Math.min(params.count || 50, 50),
    },
    currency: params.currency,
  }

  // Add optional filters
  if (params.minPrice !== undefined) {
    requestBody.filtering.lowestPrice = Math.floor(params.minPrice)
  }

  if (params.maxPrice !== undefined) {
    requestBody.filtering.highestPrice = Math.ceil(params.maxPrice)
  }

  if (params.startDate) {
    requestBody.filtering.startDate = params.startDate
  }

  if (params.endDate) {
    requestBody.filtering.endDate = params.endDate
  }

  if (params.categoryTags && params.categoryTags.length > 0) {
    requestBody.filtering.tags = [...(requestBody.filtering.tags || []), ...params.categoryTags]
  }

  if (params.confirmationType) {
    requestBody.filtering.confirmationType = params.confirmationType
  }

  if (params.freeCancellation) {
    requestBody.filtering.freeCancellation = true
  }

  const endpoint = `${VIATOR_BASE_URL}/products/search`

  console.log("[Viator] Constructed request body:", JSON.stringify(requestBody, null, 2))
  console.log("[Viator] Full endpoint:", endpoint)

  console.log("====== FINAL VIATOR API CALL ======")
  console.log("Endpoint:", endpoint)
  console.log("Method: POST")
  console.log(
    "Headers:",
    JSON.stringify(
      {
        ...REQUIRED_HEADERS,
        "Content-Type": "application/json;version=2.0",
      },
      null,
      2,
    ),
  )
  console.log("Request Body:", JSON.stringify(requestBody, null, 2))
  console.log("===================================")

  try {
    // Log the request
    logApiRequest(
      endpoint,
      "POST",
      {
        ...REQUIRED_HEADERS,
        "Content-Type": "application/json;version=2.0",
      },
      requestBody,
    )

    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...REQUIRED_HEADERS,
        "Content-Type": "application/json;version=2.0",
      },
      body: JSON.stringify(requestBody),
    })

    // Get response text first
    let responseText = await response.text()
    console.log(`[Viator] Search response status: ${response.status}`)
    console.log(`[Viator] Search response text (first 1000 chars):`, responseText.substring(0, 1000))

    if (!response.ok) {
      throw new Error(`Viator API error: ${response.status}`)
    }

    // Parse response
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[Viator] Failed to parse search response JSON:", parseError)
      console.error("[Viator] Response text:", responseText)
      throw new Error("Invalid JSON response from Viator search API")
    }

    logApiResponse(endpoint, response.status, response.headers, data)

    if (data.products?.length === 0 && requestBody.filtering.tags) {
      console.log("[Viator] No results with quality tags, retrying without filters...")
      delete requestBody.filtering.tags

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...REQUIRED_HEADERS,
          "Content-Type": "application/json;version=2.0",
        },
        body: JSON.stringify(requestBody),
      })

      responseText = await response.text()
      console.log(`[Viator] Retry response status: ${response.status}`)

      if (response.ok) {
        try {
          data = JSON.parse(responseText)
          console.log(`[Viator] Retry successful - found ${data.products?.length || 0} products`)
        } catch (parseError) {
          console.error("[Viator] Failed to parse retry response:", parseError)
        }
      }
    }

    console.log(
      `[Viator] Search successful - found ${data.totalCount} total products, returning ${data.products?.length || 0}`,
    )
    console.log("[Viator] ========== SEARCH PRODUCTS END ==========")

    return {
      products: data.products || [],
      totalCount: data.totalCount || 0,
    }
  } catch (error: any) {
    console.error("[Viator] ========== SEARCH ERROR ==========")
    console.error("[Viator] Error message:", error.message)
    console.error("[Viator] Error stack:", error.stack)
    console.error("[Viator] ======================================")
    throw error
  }
}

// Get product details
export async function getProductDetails(productCode: string): Promise<ViatorProduct> {
  console.log(`[Viator] Fetching product details for: ${productCode}`)

  try {
    const response = await fetch(`${VIATOR_BASE_URL}/products/${productCode}`, {
      method: "GET",
      headers: REQUIRED_HEADERS,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch product details: ${response.status}`)
    }

    const product = await response.json()
    console.log(`[Viator] Product details fetched successfully`)

    return product
  } catch (error) {
    console.error("[Viator] Error fetching product details:", error)
    throw error
  }
}

// Optional: Cache warming function
export async function warmCache(): Promise<void> {
  console.log("[Viator] Warming destination cache...")
  await fetchDestinations()
}

/**
 * Log API request details for debugging
 */
function logApiRequest(endpoint: string, method: string, headers: any, body?: any) {
  console.log(`[Viator API] ========== REQUEST ==========`)
  console.log(`[Viator API] Endpoint: ${method} ${endpoint}`)
  console.log(`[Viator API] Headers:`, JSON.stringify(headers, null, 2))
  if (body) {
    console.log(`[Viator API] Body:`, JSON.stringify(body, null, 2))
  }
  console.log(`[Viator API] ================================`)
}

/**
 * Log API response details for debugging
 */
function logApiResponse(endpoint: string, status: number, headers: any, body?: any) {
  console.log(`[Viator API] ========== RESPONSE ==========`)
  console.log(`[Viator API] Endpoint: ${endpoint}`)
  console.log(`[Viator API] Status: ${status}`)
  console.log(`[Viator API] Headers:`, {
    "content-type": headers.get("content-type"),
    "x-unique-id": headers.get("x-unique-id"),
    "ratelimit-limit": headers.get("ratelimit-limit"),
    "ratelimit-remaining": headers.get("ratelimit-remaining"),
  })
  if (body) {
    console.log(`[Viator API] Body:`, JSON.stringify(body, null, 2))
  }
  console.log(`[Viator API] =================================`)
}
