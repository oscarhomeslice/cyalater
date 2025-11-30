import { type NextRequest, NextResponse } from "next/server"
import {
  initializeDestinations,
  findDestinationByName,
  getSuggestedDestinations,
} from "@/lib/services/viator-destinations"
import { transformSearchContextToViatorParams } from "@/lib/mappers/viator-search-mapper"
import { mapViatorProductsToActivities, generateBestForSnippets } from "@/lib/mappers/viator-response-mapper"
import { scoreAndSortActivities } from "@/lib/utils/activity-scorer"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

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

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/search-real-activities",
    methods: ["GET", "POST"],
    message: "POST requires: location, groupSize, budgetPerPerson, currency, vibe, inspirationActivities",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0 DEBUG] POST /api/search-real-activities called at", new Date().toISOString())
  console.log("[v0 DEBUG] Request headers:", Object.fromEntries(request.headers.entries()))
  console.log("[v0 DEBUG] Request URL:", request.url)

  console.log("[Viator API] ===== NEW REQUEST =====")

  // Step 1: Parse and validate request body
  let body: RequestBody
  try {
    console.log("[v0 DEBUG] About to parse request body...")
    body = await request.json()
    console.log("[v0 DEBUG] Request body parsed successfully")

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
    console.error("[v0 DEBUG] Failed to parse request body - Error details:", error)
    console.error("[v0 DEBUG] Failed to parse request body:", error)
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
    console.log("[v0 DEBUG] Entering main try block")

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
      console.error("[Viator API] ✗ CRITICAL: Failed to initialize destinations:", initError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load destinations database. Please check Viator API configuration.",
          details: isDevelopment ? String(initError) : undefined,
        },
        { status: 503 },
      )
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

    console.log("[Viator API] STEP 6: Calling Viator /products/search with fallback strategy...")
    const baseUrl = process.env.VIATOR_API_BASE_URL || "https://api.viator.com/partner"
    const viatorUrl = `${baseUrl}/products/search`

    console.log("[Viator API] Request URL:", viatorUrl)

    // Attempt 1: Try with minimal filters (already configured in mapper)
    console.log("[Viator API] Attempt 1: Minimal filters with wide price range")
    let viatorResponse = await fetch(viatorUrl, {
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

    let viatorData = await viatorResponse.json()
    console.log("[Viator API] ✓ Products retrieved (Attempt 1):", viatorData.products?.length || 0)

    if (!viatorData.products || viatorData.products.length === 0) {
      console.log("[Viator API] Attempt 2: Removing price filter completely")
      const noPriceFilterParams = {
        ...viatorSearchParams,
        filtering: {
          ...viatorSearchParams.filtering,
          lowestPrice: undefined,
          highestPrice: undefined,
        },
      }

      viatorResponse = await fetch(viatorUrl, {
        method: "POST",
        headers: {
          "exp-api-key": process.env.VIATOR_API_KEY,
          "Accept-Language": "en-US",
          Accept: "application/json;version=2.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noPriceFilterParams),
      })

      if (viatorResponse.ok) {
        viatorData = await viatorResponse.json()
        console.log("[Viator API] ✓ Products retrieved (Attempt 2):", viatorData.products?.length || 0)
      }
    }

    if (!viatorData.products || viatorData.products.length === 0) {
      console.log("[Viator API] Attempt 3: Absolute minimal - destination only")
      const minimalParams = {
        filtering: {
          destination: destinationMatch.destinationId.toString(),
          includeAutomaticTranslations: true,
        },
        sorting: {
          sort: "DEFAULT",
          order: "DESCENDING",
        },
        pagination: {
          start: 1,
          count: 50,
        },
        currency: body.currency || "EUR",
      }

      viatorResponse = await fetch(viatorUrl, {
        method: "POST",
        headers: {
          "exp-api-key": process.env.VIATOR_API_KEY,
          "Accept-Language": "en-US",
          Accept: "application/json;version=2.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(minimalParams),
      })

      if (viatorResponse.ok) {
        viatorData = await viatorResponse.json()
        console.log("[Viator API] ✓ Products retrieved (Attempt 3):", viatorData.products?.length || 0)
      }
    }

    // Step 8: Check for empty results after all attempts
    if (!viatorData.products || viatorData.products.length === 0) {
      console.log("[Viator API] STEP 7: No products found after all fallback attempts")

      const popularDestinations = await getSuggestedDestinations(5)

      return NextResponse.json({
        success: true,
        recommendations: {
          activities: [],
          proTips: [
            `No activities found in ${destinationMatch.destinationName}.`,
            `This destination may not have activities available on Viator.`,
            `Try popular alternatives: ${popularDestinations.slice(0, 3).join(", ")}`,
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
          vibe: body.vibe,
          activity_category: body.activityCategory,
        },
        isEmpty: true,
        suggestions: popularDestinations,
        isRealActivities: true,
        step: "EMPTY_RESULTS",
      })
    }

    // Step 9: Transform Viator response to ActivityData format
    console.log("[Viator API] STEP 8: Transforming Viator products to activities...")
    const activities = mapViatorProductsToActivities(
      viatorData.products,
      body.currency || "EUR",
      body.groupSize,
      body.vibe,
    )

    console.log("[Viator API] ✓ Activities transformed:", activities.length)

    console.log("[Viator API] STEP 8.5: Scoring and sorting activities by relevance...")
    const scoredActivities = scoreAndSortActivities(activities, {
      budgetPerPerson: body.budgetPerPerson || 50,
      currency: body.currency || "EUR",
      vibe: body.vibe,
      inspirationActivities: body.inspirationActivities,
      timeOfDay: body.timeOfDay,
      indoorOutdoor: body.indoorOutdoor,
    })

    console.log("[Viator API] ✓ Activities scored and sorted by relevance")
    console.log(
      "[Viator API] Top 3 scores:",
      scoredActivities.slice(0, 3).map((a) => ({
        name: a.name,
        score: a.relevanceScore,
        cost: a.cost,
      })),
    )

    console.log("[Viator API] STEP 8.6: Enriching activities with contextual descriptions...")

    // First, generate enriched bestFor for all activities
    const activitiesWithBestFor = scoredActivities.map((scored) => {
      const safeTagsArray = (scored.tags || []).filter((t): t is string => typeof t === "string")
      const safeHighlightsArray = (scored.highlights || []).filter((h): h is string => typeof h === "string")

      // Generate enriched bestFor text using scoring breakdown
      const enrichedBestFor = generateBestForSnippets({
        groupSize: body.groupSize,
        vibe: body.vibe,
        budgetPerPerson: body.budgetPerPerson || 50,
        timeOfDay: body.timeOfDay,
        matchedInspirationName: undefined,
        scoring: scored.scoringBreakdown,
        rating: scored.rating,
        reviewCount: scored.reviewCount,
      })

      return {
        ...scored,
        bestFor: enrichedBestFor,
        highlights: safeHighlightsArray,
      }
    })

    console.log("[Viator API] Enriching specialElement with OpenAI for top activities...")

    let enrichedActivities = activitiesWithBestFor

    try {
      // Take top 10 activities for enrichment
      const activitiesToEnrich = activitiesWithBestFor.slice(0, 10)

      if (activitiesToEnrich.length > 0 && process.env.OPENAI_API_KEY) {
        const enrichmentPrompt = `You are personalizing activity descriptions for travelers.

USER CONTEXT:
- Group: ${body.groupSize} ${body.groupRelationship || "travelers"}
- Budget: €${body.budgetPerPerson || 50} per person
- Vibe: ${body.vibe || "adventurous"}
- Preferences: ${body.timeOfDay || "flexible"}, ${body.indoorOutdoor || "flexible"}

ACTIVITIES TO ENRICH:
${activitiesToEnrich
  .map(
    (activity, idx) => `
${idx + 1}. ID: ${activity.id}
   Name: ${activity.name}
   Highlights: ${activity.highlights?.join(", ") || "N/A"}
   Rating: ${activity.rating ? activity.rating.toFixed(1) : "N/A"}/5
`,
  )
  .join("\n")}

For each activity, write ONE compelling sentence (max 20 words) for "what makes it special" that:
1. Uses the ACTUAL highlights provided (never make anything up)
2. Explains why THIS specific group would love it
3. Focuses on the memorable experience, not just listing features
4. Is specific and vivid

Return ONLY a JSON array with this exact format:
[{ "id": "activity-id", "specialElement": "Your compelling sentence here" }]

Do not include any text before or after the JSON array.`

        console.log("[Viator API] Calling OpenAI for enrichment...")

        const openai = createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: enrichmentPrompt,
          maxTokens: 500,
        })

        console.log("[Viator API] OpenAI enrichment response received")

        // Parse the response
        const enrichmentResults = JSON.parse(text.trim())

        console.log("[Viator API] Parsed enrichment results:", enrichmentResults.length)

        // Apply enriched specialElement to activities
        enrichedActivities = activitiesWithBestFor.map((activity) => {
          const enrichment = enrichmentResults.find((r: any) => r.id === activity.id)

          if (enrichment && enrichment.specialElement) {
            console.log(`[Viator API] Enriched "${activity.name}" specialElement: "${enrichment.specialElement}"`)
            return {
              ...activity,
              specialElement: enrichment.specialElement,
            }
          }

          // Fallback to formatted highlights if no enrichment
          if (activity.highlights && activity.highlights.length > 0) {
            const formatted = activity.highlights.slice(0, 3).join(", ")
            return {
              ...activity,
              specialElement: formatted,
            }
          }

          return activity
        })

        console.log("[Viator API] ✓ OpenAI enrichment completed successfully")
      } else {
        console.log("[Viator API] Skipping OpenAI enrichment (no activities or API key not set)")
      }
    } catch (enrichmentError) {
      console.error("[Viator API] OpenAI enrichment failed, using fallback:", enrichmentError)

      // Fallback: Format highlights nicely
      enrichedActivities = activitiesWithBestFor.map((activity) => {
        if (activity.highlights && activity.highlights.length > 0) {
          const topHighlights = activity.highlights.slice(0, 3)
          let formatted: string

          if (topHighlights.length === 1) {
            formatted = topHighlights[0]
          } else if (topHighlights.length === 2) {
            formatted = `${topHighlights[0]} and ${topHighlights[1]}`
          } else {
            formatted = `${topHighlights[0]}, ${topHighlights[1]}, and ${topHighlights[2]}`
          }

          return {
            ...activity,
            specialElement: formatted,
          }
        }
        return activity
      })
    }

    console.log("[Viator API] ✓ Activities enriched with contextual descriptions")
    console.log("[Viator API] Example enriched bestFor:", enrichedActivities[0]?.bestFor)
    console.log("[Viator API] Example enriched specialElement:", enrichedActivities[0]?.specialElement)

    // Step 10: Build final response with scored activities
    console.log("[Viator API] STEP 9: Building response...")
    const response = {
      success: true,
      recommendations: {
        activities: enrichedActivities, // Now includes enriched bestFor text
        proTips: [
          "Activities shown are ranked by relevance to your preferences",
          "Most activities offer free cancellation up to 24 hours in advance",
          "Instant confirmation products are confirmed immediately upon booking",
          "Prices shown are per person unless otherwise stated",
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
      scoringApplied: true, // Flag to indicate activities are relevance-sorted
    }

    console.log("[Viator API] ✓ Response built successfully with scored activities")
    console.log("[Viator API] ===== REQUEST COMPLETED =====")

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[v0 DEBUG] Caught error in main try block")
    console.error("[Viator API] ===== ERROR =====")
    console.error("[Viator API] Error type:", error.constructor.name)
    console.error("[Viator API] Error message:", error.message)
    if (isDevelopment) {
      console.error("[Viator API] Stack trace:", error.stack)
    }
    console.error("[v0 DEBUG] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
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
              errorType: error.constructor.name,
              errorMessage: error.message,
            }
          : undefined,
      },
      { status: 500 },
    )
  }
}
