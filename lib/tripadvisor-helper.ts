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
  category: string
  ranking: string | null
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
  } catch (error: any) {
    const status = error.response?.status
    console.error(`[v0] TripAdvisor details error for locationId ${locationId}:`, {
      status,
      message: error.message,
    })

    if (status === 403) {
      console.warn(
        `[v0] ⚠️ TripAdvisor API returned 403 for location ${locationId}. ` +
          `Check that your domain is whitelisted in TripAdvisor API settings. ` +
          `Visit: https://www.tripadvisor.com/developers`,
      )
    }

    throw new Error(`Failed to get location details (status: ${status})`)
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
  } catch (error: any) {
    const status = error.response?.status
    console.warn(`[v0] TripAdvisor photos error for location ${locationId}:`, {
      status,
      message: error.message,
    })

    if (status === 403) {
      console.warn(
        `[v0] ⚠️ TripAdvisor API returned 403 for photos ${locationId}. ` +
          `Photos will be skipped. Check domain whitelist at: https://www.tripadvisor.com/developers`,
      )
    }

    return null // Return null on error, don't throw - photos are optional
  }
}

async function enrichLocationData(locationId: string): Promise<EnrichedLocation | null> {
  try {
    // Parallelize details and photos requests
    const [details, photos] = await Promise.all([
      getLocationDetails(locationId).catch((err) => {
        console.warn(`[v0] ⚠️ Failed to get details for locationId ${locationId}, skipping this location`)
        return null
      }),
      getLocationPhotos(locationId, 1).catch((err) => {
        console.log(`[v0] No photos available for locationId ${locationId}`)
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

    // Build enriched location object with explicit field mapping from TripAdvisor API
    const enrichedLocation: EnrichedLocation = {
      name: details.name || "Unknown Location",
      rating: details.rating ? Number.parseFloat(details.rating) : null,
      reviewCount: details.num_reviews || 0, // num_reviews → reviewCount
      tripAdvisorUrl: details.web_url || "", // web_url → tripAdvisorUrl
      image: imageUrl,
      category: details.category?.name || "attraction", // category.name → category
      ranking: details.ranking_data?.ranking_string || null, // ranking_data.ranking_string → ranking
      locationId: locationId,
    }

    console.log(`[v0] ✅ Enriched location: ${enrichedLocation.name} (${enrichedLocation.category})`)
    return enrichedLocation
  } catch (error) {
    console.error(`[v0] ❌ Error enriching location ${locationId}:`, error)
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
      console.log(`[v0] ℹ️ No locations found for search query: "${location}". Returning empty results.`)
      return [] // Return empty array but don't throw error
    }

    console.log(`[v0] Found ${locationData.data.length} locations, enriching data...`)

    // Step 2: Extract location IDs (limit to top 20)
    const locationIds = locationData.data.slice(0, 20).map((loc: any) => loc.location_id)

    // Step 3: Parallelize enrichment requests for all locations
    const enrichedLocations = await Promise.all(locationIds.map((id: string) => enrichLocationData(id)))

    // Step 4: Filter out null results (failed requests) and return enriched data
    const validLocations = enrichedLocations.filter((loc): loc is EnrichedLocation => loc !== null)

    const failedCount = locationIds.length - validLocations.length
    if (failedCount > 0) {
      console.warn(
        `[v0] ⚠️ Successfully enriched ${validLocations.length} out of ${locationIds.length} locations. ` +
          `${failedCount} location(s) failed but returning partial results.`,
      )
    } else {
      console.log(`[v0] ✅ Successfully enriched all ${validLocations.length} locations`)
    }

    return validLocations
  } catch (error: any) {
    const status = error.response?.status
    console.error("[v0] TripAdvisor nearby attractions error:", {
      status,
      message: error.message,
      location,
    })

    if (status === 403) {
      console.error(
        `[v0] ❌ TripAdvisor API access denied (403). ` +
          `Please check that your domain is whitelisted in TripAdvisor API settings. ` +
          `Visit: https://www.tripadvisor.com/developers`,
      )
    }

    return [] // Return empty array on error instead of throwing
  }
}
