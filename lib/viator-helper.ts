// Viator API Helper
// Handles all Viator API interactions including destination lookup and product search

const VIATOR_API_BASE_URL = process.env.VIATOR_API_BASE_URL || "https://api.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
let destinationsCache: Destination[] = []
let cacheTimestamp = 0

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
  count?: number
  tags?: number[]
  confirmationType?: "INSTANT" | "MANUAL"
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
    throw new Error("VIATOR_API_KEY environment variable is not set")
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

    if (!response.ok) {
      console.warn(`[Viator] Destinations fetch failed with status ${response.status}`)
      // Return cached data even if expired, or empty array
      return destinationsCache.length > 0 ? destinationsCache : []
    }

    const data = await response.json()
    destinationsCache = data.destinations || []
    cacheTimestamp = now

    console.log(`[Viator] Fetched ${destinationsCache.length} destinations successfully`)
    return destinationsCache
  } catch (error) {
    console.error("[Viator] Error fetching destinations:", error)
    // Return cached data even if expired, or empty array
    return destinationsCache.length > 0 ? destinationsCache : []
  }
}

// Find destination ID by location name
export async function findDestinationId(locationName: string): Promise<number | null> {
  const destinations = await fetchDestinations()
  const normalizedSearch = locationName.toLowerCase().trim()

  console.log(`[Viator] Searching for destination: "${locationName}"`)

  // Try exact match first
  let match = destinations.find(
    dest => dest.destinationName.toLowerCase() === normalizedSearch
  )

  // If no exact match, try partial match
  if (!match) {
    match = destinations.find(
      dest => dest.destinationName.toLowerCase().includes(normalizedSearch)
    )
  }

  if (match) {
    console.log(`[Viator] Found destination: ${match.destinationName} (ID: ${match.destinationId})`)
    return match.destinationId
  }

  console.warn(`[Viator] No destination found for: "${locationName}"`)
  return null
}

// Get popular destinations for error messages
export async function getPopularDestinations(limit: number = 10): Promise<string[]> {
  const destinations = await fetchDestinations()
  
  const popular = destinations
    .filter(dest => dest.destinationType === "CITY" || dest.destinationType === "COUNTRY")
    .slice(0, limit)
    .map(dest => dest.destinationName)

  return popular
}

// Search Viator products
export async function searchViatorProducts(params: SearchViatorParams): Promise<SearchResult> {
  console.log("[Viator] Searching products with params:", params)

  let destinationId: number | null = null

  // Convert destination name to ID if provided
  if (params.destination) {
    destinationId = await findDestinationId(params.destination)
    
    if (!destinationId) {
      const suggestions = await getPopularDestinations(5)
      throw new Error(
        `Destination "${params.destination}" not found. Try one of these popular destinations: ${suggestions.join(", ")}`
      )
    }
  }

  // Build request body
  const requestBody: any = {
    filtering: {
      includeAutomaticTranslations: true
    },
    sorting: {
      sort: "TRAVELER_RATING",
      order: "DESCENDING"
    },
    pagination: {
      start: 1,
      count: params.count || 10
    },
    currency: params.currency
  }

  // Add optional filters
  if (destinationId) {
    requestBody.filtering.destination = destinationId.toString()
  }
  if (params.minPrice !== undefined) {
    requestBody.filtering.lowestPrice = params.minPrice
  }
  if (params.maxPrice !== undefined) {
    requestBody.filtering.highestPrice = params.maxPrice
  }
  if (params.startDate) {
    requestBody.filtering.startDate = params.startDate
  }
  if (params.endDate) {
    requestBody.filtering.endDate = params.endDate
  }
  if (params.tags && params.tags.length > 0) {
    requestBody.filtering.tags = params.tags
  }
  if (params.confirmationType) {
    requestBody.filtering.confirmationType = params.confirmationType
  }

  try {
    const response = await fetch(`${VIATOR_API_BASE_URL}/products/search`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(requestBody)
    })

    console.log(`[Viator] Search response status: ${response.status}`)

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.")
    }

    if (response.status === 401) {
      throw new Error("Invalid API key")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || `API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const products = data.products || []
    const totalCount = data.totalCount || 0

    console.log(`[Viator] Found ${totalCount} products, returning ${products.length}`)

    return {
      products,
      totalCount
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("[Viator] Search error:", error.message)
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
