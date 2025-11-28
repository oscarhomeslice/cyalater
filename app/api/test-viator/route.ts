import { NextResponse } from "next/server"
import {
  initializeDestinations,
  getSuggestedDestinations,
  findDestinationByName,
} from "@/lib/services/viator-destinations"

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    apiConfiguration: {
      apiKeyPresent: false,
      baseUrlPresent: false,
      apiKey: "",
      baseUrl: "",
    },
    destinations: {
      initialized: false,
      cached: 0,
      samples: [] as string[],
      error: null as string | null,
    },
    search: {
      success: false,
      resultCount: 0,
      testDestination: "",
      error: null as string | null,
      sampleProducts: [] as any[],
    },
    tags: {
      initialized: false,
      totalTags: 0,
      error: null as string | null,
    },
  }

  try {
    // 1. Check API Configuration
    const apiKey = process.env.VIATOR_API_KEY
    const baseUrl = process.env.VIATOR_API_BASE_URL || "https://api.viator.com"

    diagnostics.apiConfiguration.apiKeyPresent = !!apiKey
    diagnostics.apiConfiguration.baseUrlPresent = !!baseUrl
    diagnostics.apiConfiguration.apiKey = apiKey
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : "NOT SET"
    diagnostics.apiConfiguration.baseUrl = baseUrl

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "VIATOR_API_KEY environment variable is not set",
          diagnostics,
        },
        { status: 500 },
      )
    }

    // 2. Test Destinations API
    console.log("[Viator Test] Initializing destinations...")
    try {
      await initializeDestinations()
      diagnostics.destinations.initialized = true

      const samples = await getSuggestedDestinations(10)
      diagnostics.destinations.cached = samples.length
      diagnostics.destinations.samples = samples

      console.log("[Viator Test] Destinations initialized successfully")
    } catch (error) {
      diagnostics.destinations.error = error instanceof Error ? error.message : "Unknown error"
      console.error("[Viator Test] Destination initialization failed:", error)
    }

    // 3. Test Destination Search
    if (diagnostics.destinations.initialized && diagnostics.destinations.samples.length > 0) {
      try {
        const testLocation = diagnostics.destinations.samples[0]
        console.log(`[Viator Test] Testing destination search for: ${testLocation}`)

        const match = await findDestinationByName(testLocation)
        if (match) {
          diagnostics.search.testDestination = `${match.destinationName} (ID: ${match.destinationId})`
        }
      } catch (error) {
        console.error("[Viator Test] Destination search failed:", error)
      }
    }

    // 4. Test Product Search API
    if (diagnostics.destinations.initialized && diagnostics.destinations.samples.length > 0) {
      try {
        const testLocation = diagnostics.destinations.samples[0]
        const match = await findDestinationByName(testLocation)

        if (match) {
          console.log(`[Viator Test] Testing product search for destination ID: ${match.destinationId}`)

          const searchResponse = await fetch(`${baseUrl}/partner/products/search`, {
            method: "POST",
            headers: {
              "exp-api-key": apiKey,
              "Accept-Language": "en-US",
              Accept: "application/json;version=2.0",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filtering: {
                destination: match.destinationId,
              },
              pagination: {
                offset: 0,
                limit: 5,
              },
              sorting: {
                sort: "TRAVELLER_RATING",
              },
            }),
          })

          if (!searchResponse.ok) {
            const errorText = await searchResponse.text()
            diagnostics.search.error = `HTTP ${searchResponse.status}: ${errorText}`
            console.error("[Viator Test] Product search failed:", errorText)
          } else {
            const searchData = await searchResponse.json()
            diagnostics.search.success = true
            diagnostics.search.resultCount = searchData.products?.length || 0
            diagnostics.search.sampleProducts =
              searchData.products?.slice(0, 3).map((p: any) => ({
                productCode: p.productCode,
                title: p.title,
                rating: p.reviews?.combinedAverageRating,
                price: p.pricing?.summary?.fromPrice,
              })) || []

            console.log(`[Viator Test] Product search successful: ${diagnostics.search.resultCount} results`)
          }
        }
      } catch (error) {
        diagnostics.search.error = error instanceof Error ? error.message : "Unknown error"
        console.error("[Viator Test] Product search failed:", error)
      }
    }

    // 5. Test Tags API
    try {
      console.log("[Viator Test] Testing tags API...")
      const tagsResponse = await fetch(`${baseUrl}/partner/products/tags`, {
        method: "GET",
        headers: {
          "exp-api-key": apiKey,
          "Accept-Language": "en-US",
          Accept: "application/json;version=2.0",
        },
      })

      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        diagnostics.tags.initialized = true
        diagnostics.tags.totalTags = tagsData.tags?.length || 0
        console.log(`[Viator Test] Tags API successful: ${diagnostics.tags.totalTags} tags available`)
      } else {
        const errorText = await tagsResponse.text()
        diagnostics.tags.error = `HTTP ${tagsResponse.status}: ${errorText}`
      }
    } catch (error) {
      diagnostics.tags.error = error instanceof Error ? error.message : "Unknown error"
      console.error("[Viator Test] Tags API failed:", error)
    }

    // Determine overall status
    const allPassed =
      diagnostics.apiConfiguration.apiKeyPresent &&
      diagnostics.destinations.initialized &&
      diagnostics.destinations.cached > 0 &&
      diagnostics.search.success &&
      diagnostics.tags.initialized

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? "All Viator integration tests passed!" : "Some tests failed - check diagnostics for details",
      diagnostics,
      recommendations: generateRecommendations(diagnostics),
    })
  } catch (error) {
    console.error("[Viator Test] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        diagnostics,
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = []

  if (!diagnostics.apiConfiguration.apiKeyPresent) {
    recommendations.push("Set VIATOR_API_KEY environment variable")
  }

  if (!diagnostics.destinations.initialized) {
    recommendations.push("Check Viator destinations API endpoint and credentials")
  }

  if (diagnostics.destinations.cached === 0) {
    recommendations.push("No destinations were cached - verify API response format")
  }

  if (!diagnostics.search.success && diagnostics.destinations.initialized) {
    recommendations.push("Product search failed - check API permissions and request format")
  }

  if (!diagnostics.tags.initialized) {
    recommendations.push("Tags API failed - this may affect search quality")
  }

  if (recommendations.length === 0) {
    recommendations.push("All systems operational! Ready to use Viator integration.")
  }

  return recommendations
}
