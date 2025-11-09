import { getAmadeusToken } from "./amadeus-auth"
import type { EnrichedLocation } from "./types"

const BASE_URL = "https://test.api.amadeus.com/v1"

export interface AmadeusActivity {
  id: string
  type: string
  name: string
  shortDescription: string
  description?: string
  geoCode: {
    latitude: string
    longitude: string
  }
  rating?: string
  pictures?: string[]
  bookingLink?: string
  price?: {
    currencyCode: string
    amount: string
  }
  minimumDuration?: string
}

export interface AmadeusResponse {
  data: AmadeusActivity[]
  meta: {
    count: string
    links: {
      self: string
    }
  }
}

/**
 * Get coordinates for a city/location
 */
async function getCoordinates(location: string): Promise<{ lat: number; lng: number } | null> {
  // Common city coordinates (expand this list as needed)
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    // Major European Cities
    paris: { lat: 48.8566, lng: 2.3522 },
    london: { lat: 51.5074, lng: -0.1278 },
    berlin: { lat: 52.52, lng: 13.405 },
    madrid: { lat: 40.4168, lng: -3.7038 },
    rome: { lat: 41.9028, lng: 12.4964 },
    barcelona: { lat: 41.3874, lng: 2.1686 },
    amsterdam: { lat: 52.3676, lng: 4.9041 },
    vienna: { lat: 48.2082, lng: 16.3738 },
    lisbon: { lat: 38.7223, lng: -9.1393 },
    prague: { lat: 50.0755, lng: 14.4378 },
    budapest: { lat: 47.4979, lng: 19.0402 },
    athens: { lat: 37.9838, lng: 23.7275 },
    copenhagen: { lat: 55.6761, lng: 12.5683 },
    dublin: { lat: 53.3498, lng: -6.2603 },
    edinburgh: { lat: 55.9533, lng: -3.1883 },
    munich: { lat: 48.1351, lng: 11.582 },
    milan: { lat: 45.4642, lng: 9.19 },
    zurich: { lat: 47.3769, lng: 8.5417 },
    stockholm: { lat: 59.3293, lng: 18.0686 },
    oslo: { lat: 59.9139, lng: 10.7522 },
    helsinki: { lat: 60.1695, lng: 24.9354 },
    brussels: { lat: 50.8503, lng: 4.3517 },
    warsaw: { lat: 52.2297, lng: 21.0122 },
    hamburg: { lat: 53.5511, lng: 9.9937 },

    // Regions/Areas
    tuscany: { lat: 43.7711, lng: 11.2486 },
    alps: { lat: 46.8182, lng: 8.2275 },
    "swiss alps": { lat: 46.8182, lng: 8.2275 },
    dolomites: { lat: 46.4102, lng: 11.844 },
    "scottish highlands": { lat: 57.4778, lng: -4.2247 },
    "lake district": { lat: 54.4609, lng: -3.0886 },
    pyrenees: { lat: 42.639, lng: 1.4485 },
    croatia: { lat: 45.1, lng: 15.2 },
    mallorca: { lat: 39.6953, lng: 3.0176 },
    santorini: { lat: 36.3932, lng: 25.4615 },
    iceland: { lat: 64.9631, lng: -19.0208 },
    norway: { lat: 60.472, lng: 8.4689 },
    porto: { lat: 41.1579, lng: -8.6291 },
    marrakech: { lat: 31.6295, lng: -7.9811 },

    // US Cities (for testing)
    "new york": { lat: 40.7128, lng: -74.006 },
    "new york city": { lat: 40.7128, lng: -74.006 },
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    "san francisco": { lat: 37.7749, lng: -122.4194 },
    chicago: { lat: 41.8781, lng: -87.6298 },
  }

  const normalizedLocation = location.toLowerCase().trim()
  return cityCoordinates[normalizedLocation] || null
}

/**
 * Search for activities by location name
 */
export async function searchActivitiesByLocation(
  location: string,
  radius = 20, // Max radius is 20km
): Promise<AmadeusActivity[]> {
  try {
    // Get coordinates for the location
    const coords = await getCoordinates(location)

    if (!coords) {
      console.warn(`[Amadeus] No coordinates found for location: ${location}`)
      // Fallback to Paris if location not found
      return searchActivitiesByCoordinates(48.8566, 2.3522, radius)
    }

    return searchActivitiesByCoordinates(coords.lat, coords.lng, radius)
  } catch (error) {
    console.error("[Amadeus] Location search error:", error)
    return []
  }
}

/**
 * Search for activities by coordinates
 */
export async function searchActivitiesByCoordinates(
  latitude: number,
  longitude: number,
  radius = 20,
): Promise<AmadeusActivity[]> {
  try {
    const token = await getAmadeusToken()

    // Ensure radius is within bounds (0-20km)
    const safeRadius = Math.min(Math.max(radius, 1), 20)

    const url = `${BASE_URL}/shopping/activities?latitude=${latitude}&longitude=${longitude}&radius=${safeRadius}`

    console.log(`[Amadeus] Searching activities at ${latitude}, ${longitude} within ${safeRadius}km`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.amadeus+json",
      },
    })

    if (!response.ok) {
      console.error("[Amadeus] API error:", response.status, response.statusText)
      return []
    }

    const data: AmadeusResponse = await response.json()
    console.log(`[Amadeus] Found ${data.data?.length || 0} activities`)
    return data.data || []
  } catch (error) {
    console.error("[Amadeus] Activities search error:", error)
    return []
  }
}

/**
 * Search for activities in a bounding box (for broader area searches)
 */
export async function searchActivitiesByArea(location: string, searchRadiusKm = 50): Promise<AmadeusActivity[]> {
  try {
    const coords = await getCoordinates(location)

    if (!coords) {
      console.warn(`[Amadeus] No coordinates found for location: ${location}`)
      return []
    }

    // Convert km to approximate lat/lng degrees
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude varies by latitude
    const latDelta = searchRadiusKm / 111
    const lngDelta = searchRadiusKm / (111 * Math.cos((coords.lat * Math.PI) / 180))

    const token = await getAmadeusToken()

    const url =
      `${BASE_URL}/shopping/activities/by-square?` +
      `north=${coords.lat + latDelta}&` +
      `south=${coords.lat - latDelta}&` +
      `east=${coords.lng + lngDelta}&` +
      `west=${coords.lng - lngDelta}`

    console.log(`[Amadeus] Searching activities in area around ${location}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.amadeus+json",
      },
    })

    if (!response.ok) {
      console.error("[Amadeus] Area search error:", response.status)
      return []
    }

    const data: AmadeusResponse = await response.json()
    console.log(`[Amadeus] Found ${data.data?.length || 0} activities in area`)
    return data.data || []
  } catch (error) {
    console.error("[Amadeus] Area search error:", error)
    return []
  }
}

/**
 * Transform Amadeus activity to EnrichedLocation format
 */
function transformToEnrichedLocation(activity: AmadeusActivity): EnrichedLocation {
  return {
    name: activity.name,
    rating: activity.rating ? Number.parseFloat(activity.rating) : null,
    reviewCount: 0, // Amadeus doesn't provide review counts
    tripAdvisorUrl: activity.bookingLink || "",
    image: activity.pictures?.[0] || null,
    category: activity.type || "activity",
    ranking: null, // Amadeus doesn't provide ranking strings
    locationId: activity.id,
  }
}

/**
 * Main function to get nearby attractions (replaces TripAdvisor getNearbyAttractions)
 * Tries multiple strategies to find activities
 */
export async function getNearbyAttractions(location: string): Promise<EnrichedLocation[]> {
  try {
    console.log(`[Amadeus] Searching for activities in: ${location}`)

    // Strategy 1: Try narrow search (20km radius)
    let activities = await searchActivitiesByLocation(location, 20)

    // Strategy 2: If not enough results, try broader area search
    if (activities.length < 5) {
      console.log("[Amadeus] Not enough results, trying broader search...")
      const areaActivities = await searchActivitiesByArea(location, 50)
      activities = [...activities, ...areaActivities]
    }

    // Remove duplicates
    const uniqueActivities = activities.filter(
      (activity, index, self) => index === self.findIndex((a) => a.id === activity.id),
    )

    console.log(`[Amadeus] Found ${uniqueActivities.length} unique activities`)

    // Transform to EnrichedLocation format
    const enrichedLocations = uniqueActivities
      .slice(0, 30) // Limit to 30 activities
      .map(transformToEnrichedLocation)

    return enrichedLocations
  } catch (error) {
    console.error("[Amadeus] Get nearby attractions error:", error)
    return []
  }
}

export { searchActivitiesByLocation as searchActivities }
