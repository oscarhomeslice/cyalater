import { type NextRequest, NextResponse } from "next/server"
import {
  initializeDestinations,
  findDestinationByName,
  getSuggestedDestinations,
} from "@/lib/services/viator-destinations"
import { transformSearchContextToViatorParams } from "@/lib/mappers/viator-search-mapper"
import { mapViatorProductsToActivities } from "@/lib/mappers/viator-response-mapper"

interface RequestBody {
  location?: string
  budgetPerPerson?: number
  currency?: string
  groupSize: string
  vibe?: string
  inspirationActivities?: Array<{
    id?: string
    name: string
    experience?: string
    tags?: string[]
    cost?: number
    duration?: string
    activityLevel?: string
    locationType?: string
    [key: string]: any
  }>
  activityCategory?: "diy" | "experience"
  groupRelationship?: string
  timeOfDay?: string
  indoorOutdoor?: string
  accessibilityNeeds?: string
}

const isDevelopment = process.env.NODE_ENV === "development"

export async function POST(request: NextRequest) {
  console.log("[Viator API] ===== NEW REQUEST =====")

  // Step 1: Parse and validate request body
  let body: RequestBody
  try {
    body = await request.json()
    console.log("[Viator API] Request body received:")
    console.log("[Viator API] - Location:", body.location)
    console.log("[Viator API] - Budget:", body.budgetPerPerson)
    console.log("[Viator API] - Currency:", body.currency)
    console.log("[Viator API] - Group Size:", body.groupSize)
    console.log("[Viator API] - Vibe:", body.vibe)
    console.log("[Viator API] - Inspiration Activities Count:", body.inspirationActivities?.length || 0)
    if (body.inspirationActivities && body.inspirationActivities.length > 0) {
      console.log("[Viator API] - First Inspiration Activity:", JSON.stringify(body.inspirationActivities[0], null, 2))
      console.log(
        "[Viator API] - All Inspiration Activity Names:",
        body.inspirationActivities.map((a) => a.name),
      )
    } else {
      console.warn("[Viator API] ⚠ No inspiration activities received in request!")
    }
  } catch (error) {
    console.error("[Viator API] Failed to parse request body:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body",
        details: isDevelopment ? "Could not parse JSON" : undefined,
      },
      { status: 400 },
    )
  }

  try {
    // Step 2: Check API key
    console.log("[Viator API] STEP 1: Checking API configuration...")
    if (!process.env.VIATOR_API_KEY) {
      console.error("[Viator API] ✗ VIATOR_API_KEY not set")
      return NextResponse.json(
        {
          success: false,
          error: "Viator API is not configured. Please add VIATOR_API_KEY to environment variables.",
        },
        { status: 503 },
      )
    }
    console.log("[Viator API] ✓ API key present")

    // Step 3: Initialize destinations
    console.log("[Viator API] STEP 2: Initializing destinations cache...")
    try {
      await initializeDestinations()
      console.log("[Viator API] ✓ Destinations initialized")
    } catch (initError) {
      console.warn("[Viator API] ⚠ Destinations initialization warning:", initError)
      // Continue - the service will handle this gracefully
    }

    // Step 4: Validate required fields
    console.log("[Viator API] STEP 3: Validating request parameters...")
    const { location, groupSize } = body

    if (!location) {
      console.warn("[Viator API] ✗ No location provided")
      return NextResponse.json(
        {
          success: false,
          error: "Location is required to search activities",
        },
        { status: 400 },
      )
    }

    if (!groupSize) {
      console.warn("[Viator API] ✗ No group size provided")
      return NextResponse.json(
        {
          success: false,
          error: "Group size is required to search activities",
        },
        { status: 400 },
      )
    }
    console.log("[Viator API] ✓ Required parameters valid")

    // Step 5: Find destination using fuzzy search
    console.log(`[Viator API] STEP 4: Finding destination for "${location}"...`)
    const destinationMatch = await findDestinationByName(location)

    if (!destinationMatch) {
      console.warn(`[Viator API] ✗ No destination match found for "${location}"`)

      // Get actual suggestions from cached destinations (not hardcoded)
      const suggestions = await getSuggestedDestinations(8)

      return NextResponse.json(
        {
          success: false,
          error: `We couldn't find "${location}" in our destinations database.`,
          message: "Try searching for a major city, landmark, or popular destination.",
          suggestions: suggestions.length > 0 ? suggestions : [],
          step: "DESTINATION_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    console.log(`[Viator API] ✓ Destination matched:`, {
      name: destinationMatch.destinationName,
      id: destinationMatch.destinationId,
      type: destinationMatch.destinationType,
      confidence: destinationMatch.matchConfidence,
    })

    // Step 6: Transform user search context to Viator parameters
    console.log("[Viator API] STEP 5: Transforming search context to Viator parameters...")
    console.log("[Viator API] Passing to mapper:", {
      destinationId: destinationMatch.destinationId,
      destinationName: destinationMatch.destinationName,
      budgetPerPerson: body.budgetPerPerson,
      currency: body.currency || "EUR",
      groupSize: body.groupSize,
      vibe: body.vibe,
      inspirationActivitiesCount: body.inspirationActivities?.length || 0,
    })

    const viatorSearchParams = transformSearchContextToViatorParams({
      destinationId: destinationMatch.destinationId,
      destinationName: destinationMatch.destinationName,
      budgetPerPerson: body.budgetPerPerson,
      currency: body.currency || "EUR",
      groupSize: body.groupSize,
      vibe: body.vibe,
      inspirationActivities: body.inspirationActivities,
    })

    console.log("[Viator API] ✓ Viator search parameters prepared")
    console.log("[Viator API] Search params summary:", {
      destinationId: viatorSearchParams.filtering?.destination,
      currency: viatorSearchParams.currency,
      pricingUnit: viatorSearchParams.pricingUnit,
      sorting: viatorSearchParams.sorting,
      tagCount: viatorSearchParams.filtering?.tags?.length || 0,
    })

    // Step 7: Call Viator /products/search endpoint
    console.log("[Viator API] STEP 6: Calling Viator /products/search...")
    const viatorUrl = `${process.env.VIATOR_API_BASE_URL || "https://api.viator.com"}/partner/products/search`

    console.log("[Viator API] Request URL:", viatorUrl)

    const viatorResponse = await fetch(viatorUrl, {
      method: "POST",
      headers: {
        "exp-api-key": process.env.VIATOR_API_KEY,
        "Accept-Language": "en-US",
        Accept: "application/json;version=2.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(viatorSearchParams),
    })

    console.log("[Viator API] Response status:", viatorResponse.status)

    if (!viatorResponse.ok) {
      const errorText = await viatorResponse.text()
      console.error("[Viator API] ✗ Viator API error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: "Failed to search activities from Viator",
          details: isDevelopment ? errorText : undefined,
        },
        { status: viatorResponse.status },
      )
    }

    const viatorData = await viatorResponse.json()
    console.log("[Viator API] ✓ Products retrieved:", viatorData.products?.length || 0)

    // Step 8: Check for empty results
    if (!viatorData.products || viatorData.products.length === 0) {
      console.log("[Viator API] STEP 7: No products found")

      const popularDestinations = await getSuggestedDestinations(5)

      return NextResponse.json({
        success: true,
        recommendations: {
          activities: [],
          proTips: [
            `No activities found matching your criteria in ${destinationMatch.destinationName}.`,
            `Try adjusting your budget, dates, or exploring nearby destinations.`,
            `Popular alternatives: ${popularDestinations.slice(0, 3).join(", ")}`,
          ],
          refinementPrompts: popularDestinations.map((d) => `Explore ${d}`),
        },
        query: {
          location: destinationMatch.destinationName,
          destinationId: destinationMatch.destinationId,
          matchConfidence: destinationMatch.matchConfidence,
          budgetPerPerson: body.budgetPerPerson,
          currency: body.currency || "EUR",
          groupSize: body.groupSize,
        },
        isEmpty: true,
        suggestions: popularDestinations,
        isRealActivities: true,
        step: "EMPTY_RESULTS",
      })
    }

    // Step 9: Transform Viator response to ActivityData format
    console.log("[Viator API] STEP 8: Transforming Viator products to activities...")
    const activities = mapViatorProductsToActivities(viatorData.products, {
      currency: body.currency || "EUR",
      groupSize: body.groupSize,
      vibe: body.vibe,
    })

    console.log("[Viator API] ✓ Activities transformed:", activities.length)

    // Step 10: Build final response
    console.log("[Viator API] STEP 9: Building response...")
    const response = {
      success: true,
      recommendations: {
        activities,
        proTips: [
          "Most activities offer free cancellation up to 24 hours in advance",
          "Instant confirmation products are confirmed immediately upon booking",
          "Prices shown are per person unless otherwise stated",
          "Check meeting point details and arrival instructions before booking",
        ],
        refinementPrompts: [
          "Show only top-rated experiences",
          "More budget-friendly options",
          "Instant confirmation only",
          "Free cancellation available",
        ],
      },
      query: {
        location: destinationMatch.destinationName,
        destinationId: destinationMatch.destinationId,
        matchConfidence: destinationMatch.matchConfidence,
        budgetPerPerson: body.budgetPerPerson,
        currency: body.currency || "EUR",
        groupSize: body.groupSize,
        vibe: body.vibe,
        activity_category: body.activityCategory,
      },
      isRealActivities: true,
      totalCount: viatorData.totalCount,
    }

    console.log("[Viator API] ✓ Response built successfully")
    console.log("[Viator API] ===== REQUEST COMPLETED =====")

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[Viator API] ===== ERROR =====")
    console.error("[Viator API] Error type:", error.constructor.name)
    console.error("[Viator API] Error message:", error.message)
    if (isDevelopment) {
      console.error("[Viator API] Stack trace:", error.stack)
    }
    console.error("[Viator API] ==================")

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while searching activities",
        details: isDevelopment ? error.message : undefined,
        debugInfo: isDevelopment
          ? {
              hasApiKey: !!process.env.VIATOR_API_KEY,
              location: body?.location,
              budget: body?.budgetPerPerson,
              currency: body?.currency,
              inspirationActivitiesReceived: body?.inspirationActivities?.length || 0,
            }
          : undefined,
      },
      { status: 500 },
    )
  }
}
