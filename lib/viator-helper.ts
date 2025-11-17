// Viator API Helper
// Handles all Viator API interactions including destination lookup and product search

const VIATOR_API_BASE_URL = process.env.VIATOR_API_BASE_URL?.replace(/\/partner$/, '') + "/partner" || "https://api.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
let destinationsCache: Destination[] = []
let cacheTimestamp = 0

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
  { destinationId: 220, destinationName: "Lisbon", destinationType: "CITY" }
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
  tags?: number[]
  confirmationType?: "INSTANT" | "MANUAL"
  sortOrder?: "DEFAULT" | "PRICE_FROM_LOW" | "REVIEW_AVG_RATING_D" // DEFAULT = featured products
}

export interface ViatorProduct {
  productCode: string
  title: string
  description: string
  images: Array<{ imageSource: string }>
  rating?: number
  reviewCount?: number
  pricing: {
    summary: {
      fromPrice: number
    }
  }
  duration?: string
  productUrl: string
}

export interface SearchResult {
  products: ViatorProduct[]
  totalCount: number
}

// Helper function to get API headers
function getHeaders(includeContentType = false): HeadersInit {
  if (!VIATOR_API_KEY) {
    console.error("[Viator] VIATOR_API_KEY is not set. Available env vars:", Object.keys(process.env).filter(k => k.includes('VIATOR')))
    throw new Error("Viator API is not configured. Please add VIATOR_API_KEY environment variable.")
  }

  const headers: HeadersInit = {
    "exp-api-key": VIATOR_API_KEY,
    "Accept-Language": "en-US",
    "Accept": "application/json;version=2.0"
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json;version=2.0"
  }

  return headers
}

// Fetch all destinations from Viator API
export async function fetchDestinations(): Promise<Destination[]> {
  const now = Date.now()
  const cacheAge = now - cacheTimestamp

  // Return cached data if less than 7 days old
  if (destinationsCache.length > 0 && cacheAge < CACHE_DURATION) {
    console.log(`[Viator] Using cached destinations (age: ${Math.round(cacheAge / (1000 * 60 * 60))} hours)`)
    return destinationsCache
  }

  console.log("[Viator] Fetching fresh destinations from API")

  try {
    const response = await fetch(`${VIATOR_API_BASE_URL}/destinations`, {
      method: "GET",
      headers: getHeaders()
    })

    console.log(`[Viator] Destinations API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[Viator] Destinations fetch failed:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      // Return cached data even if expired, or fallback to common destinations
      return destinationsCache.length > 0 ? destinationsCache : COMMON_DESTINATIONS
    }

    const data = await response.json()
    
    console.log(`[Viator] Raw API response structure:`, {
      hasDestinations: !!data.destinations,
      isArray: Array.isArray(data.destinations),
      count: data.destinations?.length,
      firstDestination: data.destinations?.[0],
      totalCount: data.totalCount
    })
    
    const rawDestinations = data.destinations || []
    const validDestinations = rawDestinations.filter((d: any) => {
      const isValid = d && 
                      typeof d.destinationId === 'number' && 
                      d.destinationName && 
                      typeof d.destinationName === 'string' &&
                      d.destinationName.trim() !== ''
      
      if (!isValid) {
        console.warn("[Viator] Invalid destination object:", d)
      }
      
      return isValid
    })
    
    destinationsCache = validDestinations
    cacheTimestamp = now

    console.log(`[Viator] Cached ${destinationsCache.length} valid destinations (filtered from ${rawDestinations.length} total)`)
    return destinationsCache
  } catch (error) {
    console.error("[Viator] Error fetching destinations:", error)
    // Return cached data even if expired, or fallback to common destinations
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
  if (!locationName || locationName.trim() === '') {
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
    if (!name || typeof name !== 'string') return false
    return normalizeText(name) === normalizedSearch
  })

  // If no exact match, try partial match with null safety
  if (!match) {
    match = destinations.find((d: any) => {
      const name = d?.destinationName
      if (!name || typeof name !== 'string') return false
      
      const normalized = normalizeText(name)
      return normalized.includes(normalizedSearch) || normalizedSearch.includes(normalized)
    })
  }
  
  if (!match) {
    match = destinations.find((d: any) => {
      const name = d?.destinationName
      if (!name || typeof name !== 'string') return false
      
      const nameWords = normalizeText(name).split(/\s+/)
      const searchWords = normalizedSearch.split(/\s+/)
      
      return searchWords.some(searchWord => 
        nameWords.some(nameWord => 
          nameWord.includes(searchWord) || searchWord.includes(nameWord)
        )
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
    .map(d => d?.destinationName)
    .filter(Boolean)
  console.log(`[Viator] Sample available destinations:`, sampleDestinations.join(", "))
  
  return null
}

// Get popular destinations for error messages
export async function getPopularDestinations(limit: number = 10): Promise<string[]> {
  let destinations = await fetchDestinations()
  
  if (destinations.length === 0) {
    destinations = COMMON_DESTINATIONS
  }
  
  const validDestinations = destinations.filter((d: any) => 
    d?.destinationName && 
    typeof d.destinationName === 'string' &&
    d.destinationName.trim() !== ''
  )
  
  // Prefer cities, then countries
  const cities = validDestinations.filter((d: any) => d.destinationType === "CITY")
  const countries = validDestinations.filter((d: any) => d.destinationType === "COUNTRY")
  
  const popular = [
    ...cities.slice(0, Math.min(limit, cities.length)),
    ...countries.slice(0, Math.max(0, limit - cities.length))
  ].slice(0, limit)

  return popular.map((d: any) => d.destinationName)
}

// Search Viator products
export async function searchViatorProducts(params: SearchViatorParams): Promise<SearchResult> {
  console.log("[Viator] Searching products with params:", params)

  if (!VIATOR_API_KEY) {
    throw new Error("VIATOR_API_KEY environment variable is not set")
  }

  if (!params.destination) {
    throw new Error("Destination is required for Viator product search")
  }

  // Convert destination name to ID
  const destinationId = await findDestinationId(params.destination)
  
  if (!destinationId) {
    const suggestions = await getPopularDestinations(5)
    throw new Error(
      `Destination "${params.destination}" not found. Try one of these popular destinations: ${suggestions.join(", ")}`
    )
  }

  // Build request body following Viator API specification
  const requestBody: any = {
    filtering: {
      destination: destinationId.toString() // Must be string per API spec
    },
    currency: params.currency || "USD",
    pagination: {
      start: 1,
      count: Math.min(params.count || 50, 50) // Enforce 50 max per Viator docs
    }
  }

  if (params.sortOrder) {
    requestBody.sortOrder = params.sortOrder
  } else {
    requestBody.sortOrder = "DEFAULT" // Use Viator's featured product ranking
  }

  // Optional filters
  if (params.minPrice !== undefined && params.maxPrice !== undefined) {
    requestBody.filtering.lowestPrice = params.minPrice
    requestBody.filtering.highestPrice = params.maxPrice
  }

  if (params.startDate && params.endDate) {
    requestBody.filtering.startDate = params.startDate
    requestBody.filtering.endDate = params.endDate
  }

  if (params.confirmationType) {
    requestBody.filtering.confirmationType = params.confirmationType
  }

  if (params.tags && params.tags.length > 0) {
    requestBody.filtering.tags = params.tags
  }

  console.log("[Viator] Request body:", JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(`${VIATOR_API_BASE_URL}/products/search`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(requestBody)
    })

    console.log(`[Viator] Search response status: ${response.status}`)
    
    const responseText = await response.text()

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.")
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[Viator] Authentication error. Check API key configuration")
      throw new Error("Invalid or missing API key. Please check your Viator API configuration.")
    }

    if (!response.ok) {
      console.error("[Viator] API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500)
      })
      
      let errorData: any = {}
      try {
        errorData = JSON.parse(responseText)
      } catch {
        // Error response is not JSON
      }
      
      const errorMessage = errorData.message || errorData.error || `API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    let data: any = {}
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[Viator] Failed to parse successful response:", parseError)
      throw new Error("Invalid JSON response from Viator API")
    }

    const products = data.products || []
    const totalCount = data.totalCount || 0

    console.log(`[Viator] Found ${totalCount} total products, returning ${products.length} in this batch`)

    return {
      products,
      totalCount
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("[Viator] Search error:", {
        message: error.message,
        destination: params.destination,
        destinationId: destinationId
      })
      throw error
    }
    console.error("[Viator] Unexpected search error:", error)
    throw new Error("Failed to search Viator products. Please try again.")
  }
}

// Get product details
export async function getProductDetails(productCode: string): Promise<ViatorProduct> {
  console.log(`[Viator] Fetching product details for: ${productCode}`)

  try {
    const response = await fetch(`${VIATOR_API_BASE_URL}/products/${productCode}`, {
      method: "GET",
      headers: getHeaders()
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

export const QUALITY_TAGS = {
  TOP_PRODUCT: 367652,
  LOW_SUPPLIER_CANCELLATION: 367653,
  LOW_LAST_MINUTE_CANCELLATION: 367654,
  EXCELLENT_QUALITY: 21972,
  BEST_CONVERSION: 22143,
  LIKELY_TO_SELL_OUT: 22083,
  ONCE_IN_LIFETIME: 11940,
  UNIQUE_EXPERIENCES: 21074,
  BEST_VALUE: 6226,
  VIATOR_PLUS: 21971
}
