import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Read environment variables
    const apiKey = process.env.VIATOR_API_KEY
    const baseUrl = process.env.VIATOR_API_BASE_URL

    // Check environment variables
    const envStatus = {
      hasApiKey: !!apiKey,
      hasBaseUrl: !!baseUrl,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : "not set",
      baseUrl: baseUrl || "not set",
    }

    if (!apiKey || !baseUrl) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        envStatus,
      })
    }

    // Construct correct destinations URL
    // Remove /partner suffix if present, then append /v1/taxonomy/destinations
    let cleanBaseUrl = baseUrl
    if (cleanBaseUrl.endsWith("/partner")) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -8)
    }
    if (cleanBaseUrl.endsWith("/")) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -1)
    }
    const destinationsUrl = `${cleanBaseUrl}/v1/taxonomy/destinations`

    // Make API request
    const response = await fetch(destinationsUrl, {
      method: "GET",
      headers: {
        "exp-api-key": apiKey,
        "Accept-Language": "en-US",
        Accept: "application/json",
      },
    })

    const data = await response.json()

    // Parse destinations from response (handle multiple formats)
    let destinations: any[] = []
    if (Array.isArray(data)) {
      destinations = data
    } else if (data.data && Array.isArray(data.data)) {
      destinations = data.data
    } else if (data.destinations && Array.isArray(data.destinations)) {
      destinations = data.destinations
    }

    // Search for Madrid
    const madridResults = destinations.filter((dest: any) => {
      const name = dest.destinationName || dest.destName || dest.name || ""
      return name.toLowerCase().includes("madrid")
    })

    // Search for test cities
    const testCities = ["Paris", "London", "New York", "Tokyo", "Barcelona"]
    const testCityResults = testCities.map((city) => ({
      city,
      results: destinations.filter((dest: any) => {
        const name = dest.destinationName || dest.destName || dest.name || ""
        return name.toLowerCase().includes(city.toLowerCase())
      }),
    }))

    // Return comprehensive debug info
    return NextResponse.json({
      success: true,
      envStatus,
      computedUrl: destinationsUrl,
      apiResponse: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      },
      destinationsCount: destinations.length,
      sampleDestinations: destinations.slice(0, 5),
      madridSearch: {
        found: madridResults.length > 0,
        count: madridResults.length,
        results: madridResults,
      },
      testCities: testCityResults.map(({ city, results }) => ({
        city,
        found: results.length > 0,
        count: results.length,
        results: results.slice(0, 3), // First 3 matches per city
      })),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
