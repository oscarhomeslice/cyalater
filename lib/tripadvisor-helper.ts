import axios from "axios"

const TRIPADVISOR_BASE_URL = "https://api.content.tripadvisor.com/api/v1"
const API_KEY = process.env.TRIPADVISOR_API_KEY

interface LocationSearchParams {
  searchQuery: string
  category?: string
  language?: string
}

interface ActivitySearchParams {
  locationId: string
  category?: string
  language?: string
}

interface EnrichedLocation {
  name: string
  rating: number | null
  reviewCount: number
  tripAdvisorUrl: string
  image: string | null
  locationType: string
  priceLevel: string | null
  duration: string | null
  rankingString: string | null
  locationId: string
}

export async function searchLocation(params: LocationSearchParams) {
  try {
    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/search`, {
      params: {
        key: API_KEY,
        searchQuery: params.searchQuery,
        category: params.category || "attractions",
        language: params.language || "en",
      },
    })

    return response.data
  } catch (error) {
    console.error("TripAdvisor location search error:", error)
    throw new Error("Failed to search location")
  }
}

export async function getLocationDetails(locationId: string) {
  try {
    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/${locationId}/details`, {
      params: {
        key: API_KEY,
        language: "en",
        currency: "USD",
      },
    })

    return response.data
  } catch (error) {
    console.error("TripAdvisor location details error:", error)
    throw new Error("Failed to get location details")
  }
}

export async function getLocationPhotos(locationId: string, limit = 1) {
  try {
    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/${locationId}/photos`, {
      params: {
        key: API_KEY,
        language: "en",
        limit,
      },
    })

    return response.data
  } catch (error) {
    console.error(`TripAdvisor photos error for location ${locationId}:`, error)
    return null // Return null on error, don't throw
  }
}

async function enrichLocationData(locationId: string): Promise<EnrichedLocation | null> {
  try {
    // Parallelize details and photos requests
    const [details, photos] = await Promise.all([
      getLocationDetails(locationId).catch((err) => {
        console.error(`Failed to get details for ${locationId}:`, err)
        return null
      }),
      getLocationPhotos(locationId, 1).catch((err) => {
        console.error(`Failed to get photos for ${locationId}:`, err)
        return null
      }),
    ])

    if (!details) {
      return null
    }

    // Extract image URL from photos response
    const imageUrl =
      photos?.data?.[0]?.images?.large?.url ||
      photos?.data?.[0]?.images?.medium?.url ||
      photos?.data?.[0]?.images?.small?.url ||
      null

    // Build enriched location object
    const enrichedLocation: EnrichedLocation = {
      name: details.name || "Unknown Location",
      rating: details.rating ? Number.parseFloat(details.rating) : null,
      reviewCount: details.num_reviews || 0,
      tripAdvisorUrl: details.web_url || "",
      image: imageUrl,
      locationType: details.category?.name || "attraction",
      priceLevel: details.price_level || null,
      duration: details.duration || null,
      rankingString: details.ranking_data?.ranking_string || null,
      locationId: locationId,
    }

    return enrichedLocation
  } catch (error) {
    console.error(`Error enriching location ${locationId}:`, error)
    return null // Continue processing other locations
  }
}

export async function searchActivities(params: ActivitySearchParams) {
  try {
    // First get the location
    const locationSearch = await searchLocation({
      searchQuery: params.locationId,
    })

    if (!locationSearch.data || locationSearch.data.length === 0) {
      return []
    }

    const locationId = locationSearch.data[0].location_id

    // Then get activities for that location
    const response = await axios.get(`${TRIPADVISOR_BASE_URL}/location/${locationId}/details`, {
      params: {
        key: API_KEY,
        language: params.language || "en",
        currency: "USD",
      },
    })

    return response.data
  } catch (error) {
    console.error("TripAdvisor activity search error:", error)
    throw new Error("Failed to search activities")
  }
}

export async function getNearbyAttractions(location: string, category = "attractions"): Promise<EnrichedLocation[]> {
  try {
    // Step 1: Search for locations
    const locationData = await searchLocation({
      searchQuery: location,
      category,
    })

    if (!locationData.data || locationData.data.length === 0) {
      console.log("[v0] No locations found for search query:", location)
      return []
    }

    console.log(`[v0] Found ${locationData.data.length} locations, enriching data...`)

    // Step 2: Extract location IDs (limit to top 20)
    const locationIds = locationData.data.slice(0, 20).map((loc: any) => loc.location_id)

    // Step 3: Parallelize enrichment requests for all locations
    const enrichedLocations = await Promise.all(locationIds.map((id: string) => enrichLocationData(id)))

    // Step 4: Filter out null results (failed requests) and return enriched data
    const validLocations = enrichedLocations.filter((loc): loc is EnrichedLocation => loc !== null)

    console.log(`[v0] Successfully enriched ${validLocations.length} out of ${locationIds.length} locations`)

    return validLocations
  } catch (error) {
    console.error("TripAdvisor nearby attractions error:", error)
    return [] // Return empty array on error
  }
}
