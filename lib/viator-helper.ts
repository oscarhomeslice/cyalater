// Viator API Helper
// Handles all Viator API interactions including destination lookup and product search

const VIATOR_BASE_URL = process.env.VIATOR_API_BASE_URL?.replace(/\/partner$/, '') + "/partner" || "https://api.viator.com/partner"
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
  "Accept": "application/json;version=2.0"
}

console.log("[Viator] Request headers configured:", {
  hasApiKey: !!REQUIRED_HEADERS["exp-api-key"],
  acceptLanguage: REQUIRED_HEADERS["Accept-Language"],
  accept: REQUIRED_HEADERS["Accept"]
})

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
  
  // Return cached data if still valid
  if (destinationsCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
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
      headers: REQUIRED_HEADERS
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
      firstDestinationSample: data.destinations?.[0]
    })
    
    // Validate and filter destinations
    const rawDestinations = data.destinations || []
    const validDestinations = rawDestinations.filter((d: any, index: number) => {
      const isValid = d && 
                      typeof d.destinationId === 'number' && 
                      d.destinationName && 
                      typeof d.destinationName === 'string' &&
                      d.destinationName.trim() !== ''
      
      if (!isValid && index < 5) {
        console.warn("[Viator] Invalid destination object at index", index, ":", d)
      }
      
      return isValid
    })
    
    destinationsCache = validDestinations
    cacheTimestamp = now
    
    console.log(`[Viator] Successfully cached ${destinationsCache.length} valid destinations (from ${rawDestinations.length} raw)`)
    
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
  console.log("====== VIATOR HELPER searchViatorProducts ======")
  console.log("Received params:", JSON.stringify(params, null, 2))
  console.log("VIATOR_BASE_URL:", VIATOR_BASE_URL)
  console.log("Will build endpoint:", `${VIATOR_BASE_URL}/products/search`)
  console.log("===============================================")
  
  console.log("[Viator] ========== SEARCH PRODUCTS START ==========")
  console.log("[Viator] Input parameters:", JSON.stringify(params, null, 2))
  
  let destinationId: number | null = null
  
  // Convert location name to ID if provided
  if (params.destination) {
    console.log(`[Viator] Looking up destination ID for: "${params.destination}"`)
    try {
      destinationId = await findDestinationId(params.destination)
      
      if (!destinationId) {
        console.error(`[Viator] Destination lookup failed for: "${params.destination}"`)
        const suggestions = await getPopularDestinations(5)
        const errorMessage = suggestions.length > 0
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

  // Build request body
  const requestBody: any = {
    filtering: {
      destination: destinationId?.toString(),
      includeAutomaticTranslations: true
    },
    sorting: {
      sort: params.sortOrder || "DEFAULT",
      order: "DESCENDING"
    },
    pagination: {
      start: 1,
      count: Math.min(params.count || 50, 50)
    },
    currency: params.currency
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
  
  if (params.tags && params.tags.length > 0) {
    requestBody.filtering.tags = params.tags
  }
  
  if (params.confirmationType) {
    requestBody.filtering.confirmationType = params.confirmationType
  }

  const endpoint = `${VIATOR_BASE_URL}/products/search`
  
  console.log("[Viator] Constructed request body:", JSON.stringify(requestBody, null, 2))
  console.log("[Viator] Full endpoint:", endpoint)

  console.log("====== FINAL VIATOR API CALL ======")
  console.log("Endpoint:", endpoint)
  console.log("Method: POST")
  console.log("Headers:", JSON.stringify({
    ...REQUIRED_HEADERS,
    "Content-Type": "application/json;version=2.0"
  }, null, 2))
  console.log("Request Body:", JSON.stringify(requestBody, null, 2))
  console.log("===================================")

  try {
    // Log the request
    logApiRequest(endpoint, "POST", {
      ...REQUIRED_HEADERS,
      "Content-Type": "application/json;version=2.0"
    }, requestBody)
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...REQUIRED_HEADERS,
        "Content-Type": "application/json;version=2.0"
      },
      body: JSON.stringify(requestBody)
    })

    // Get response text first
    const responseText = await response.text()
    console.log(`[Viator] Search response status: ${response.status}`)
    console.log(`[Viator] Search response text (first 1000 chars):`, responseText.substring(0, 1000))

    if (!response.ok) {
      const errorText = responseText
      
      console.log("====== VIATOR API ERROR ======")
      console.log("Status:", response.status)
      console.log("Status Text:", response.statusText)
      console.log("Response Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))
      console.log("Response Body:", errorText)
      console.log("==============================")
      
      console.error(`[Viator] Search API error: ${response.status}`)
      logApiResponse(endpoint, response.status, response.headers, responseText)
      
      if (response.status === 404) {
        console.error("[Viator] 404 Error - Endpoint not found")
        console.error("[Viator] Check that the endpoint URL is correct:", endpoint)
        console.error("[Viator] Check that your API key has access to this endpoint")
      }
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.")
      }
      
      if (response.status === 401) {
        console.error("[Viator] Authentication failed - check API key")
        throw new Error("Invalid API key")
      }
      
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
    
    console.log(`[Viator] Search successful - found ${data.totalCount} total products, returning ${data.products?.length || 0}`)
    console.log("[Viator] ========== SEARCH PRODUCTS END ==========")
    
    return {
      products: data.products || [],
      totalCount: data.totalCount || 0
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
      headers: REQUIRED_HEADERS
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
    'content-type': headers.get('content-type'),
    'x-unique-id': headers.get('x-unique-id'),
    'ratelimit-limit': headers.get('ratelimit-limit'),
    'ratelimit-remaining': headers.get('ratelimit-remaining')
  })
  if (body) {
    console.log(`[Viator API] Body:`, JSON.stringify(body, null, 2))
  }
  console.log(`[Viator API] =================================`)
}
