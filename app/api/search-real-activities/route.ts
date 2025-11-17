import { NextRequest, NextResponse } from "next/server"
import { searchViatorProducts, getPopularDestinations } from "@/lib/viator-helper"

interface RequestBody {
  location?: string
  budgetPerPerson?: number
  currency: string
  groupSize: string
  vibe?: string
  inspirationActivities?: any[]
}

// Helper function to truncate text
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Helper function to format duration
function formatDuration(duration: any): string {
  if (!duration) return "Varies"
  
  if (duration.fixedDurationInMinutes) {
    const minutes = duration.fixedDurationInMinutes
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${remainingMinutes}m`
    }
  }
  
  if (duration.variableDurationFromMinutes) {
    const hours = Math.floor(duration.variableDurationFromMinutes / 60)
    return `${hours}+ hours`
  }
  
  return "Varies"
}

// Helper function to infer location type from tags
function inferLocationType(tags: number[] | undefined): string {
  // TODO: Map specific Viator tag IDs to types (requires /products/tags endpoint)
  // For now, return hybrid as default
  return "hybrid"
}

// Helper function to infer activity level from tags
function inferActivityLevel(tags: number[] | undefined): string {
  // TODO: Map specific Viator tag IDs to activity levels (requires /products/tags endpoint)
  // For now, return moderate as default
  return "moderate"
}

// Helper function to build preparation text
function buildPreparationText(product: any): string {
  const texts: string[] = []
  
  if (product.bookingConfirmationSettings?.confirmationType === "INSTANT") {
    texts.push("Instant confirmation")
  }
  
  if (product.cancellationPolicy?.type === "FREE_CANCELLATION") {
    texts.push("Free cancellation available")
  }
  
  if (texts.length === 0) {
    return "Check booking details carefully"
  }
  
  return texts.join(". ") + "."
}

// Helper function to select best image
function selectBestImage(images: any[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined
  
  // Try to find high-resolution image (width >= 1024)
  for (const img of images) {
    if (img.variants) {
      const highRes = img.variants.find((v: any) => v.width >= 1024)
      if (highRes) return highRes.url
    }
  }
  
  // Fallback to any available variant
  if (images[0]?.variants && images[0].variants.length > 0) {
    return images[0].variants[0].url
  }
  
  return undefined
}

// Helper function to extract readable tags
function extractReadableTags(viatorTags: number[] | undefined): string[] {
  // TODO: Fetch actual tag names from /products/tags endpoint
  // For now, return generic tags
  return ["Experience", "Activity"]
}

export async function POST(request: NextRequest) {
  console.log("[Viator API Route] ========== NEW REQUEST ==========")
  console.log("[Viator API Route] Timestamp:", new Date().toISOString())
  
  console.log("[Viator API Route] Environment check:")
  console.log("  - VIATOR_API_KEY present:", !!process.env.VIATOR_API_KEY)
  console.log("  - VIATOR_API_KEY length:", process.env.VIATOR_API_KEY?.length)
  console.log("  - VIATOR_API_BASE_URL:", process.env.VIATOR_API_BASE_URL)
  
  let body: RequestBody | null = null
  
  console.log("[Viator API] ===== NEW REQUEST STARTED =====")
  
  try {
    // Step 1: Check API key
    console.log("[Viator API] STEP 1: Checking API key...")
    if (!process.env.VIATOR_API_KEY) {
      console.error("[Viator API] CRITICAL: VIATOR_API_KEY not set")
      return NextResponse.json(
        { 
          success: false, 
          error: "Viator API is not configured",
          step: "API_KEY_CHECK"
        },
        { status: 503 }
      )
    }
    console.log("[Viator API] STEP 1: ✓ API key exists")

    // Step 2: Parse request body
    console.log("[Viator API] STEP 2: Parsing request body...")
    try {
      body = await request.json()
      console.log("[Viator API] STEP 2: ✓ Body parsed successfully")
      console.log("[Viator API Route] Request body:", JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error("[Viator API] STEP 2: ✗ Parse failed", parseError.message)
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          step: "BODY_PARSE",
          details: parseError.message 
        },
        { status: 400 }
      )
    }

    const { location, budgetPerPerson, currency, groupSize, vibe, inspirationActivities } = body

    // Step 3: Validate location
    console.log("[Viator API] STEP 3: Validating location...")
    if (!location) {
      console.warn("[Viator API] STEP 3: ✗ No location provided")
      return NextResponse.json(
        { success: false, error: "Location is required to search real activities", step: "LOCATION_VALIDATION" },
        { status: 400 }
      )
    }
    console.log("[Viator API] STEP 3: ✓ Location valid:", location)

    // Step 4: Build search parameters
    console.log("[Viator API] STEP 4: Building search parameters...")
    const searchParams: any = {
      destination: location,
      currency: currency || "USD",
      count: 50,
      sortOrder: "DEFAULT"
    }

    if (budgetPerPerson && !isNaN(Number(budgetPerPerson))) {
      const budget = typeof budgetPerPerson === 'string' ? parseFloat(budgetPerPerson) : budgetPerPerson
      searchParams.minPrice = Math.floor(budget * 0.3)
      searchParams.maxPrice = Math.ceil(budget * 2)
    }

    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 90)
    
    searchParams.startDate = today.toISOString().split('T')[0]
    searchParams.endDate = endDate.toISOString().split('T')[0]
    
    console.log("[Viator API] STEP 4: ✓ Search params built:", JSON.stringify(searchParams, null, 2))

    // Step 5: Call Viator API
    console.log("[Viator API] STEP 5: Calling searchViatorProducts...")
    let viatorResults: any
    try {
      viatorResults = await searchViatorProducts(searchParams)
      console.log("[Viator API] STEP 5: ✓ Viator search completed, products:", viatorResults.products.length)
    } catch (viatorError: any) {
      console.error("[Viator API] STEP 5: ✗ Viator search failed")
      console.error("[Viator API] Error details:", {
        name: viatorError.name,
        message: viatorError.message,
        stack: viatorError.stack?.split('\n').slice(0, 3)
      })
      throw viatorError
    }

    // Step 6: Check for empty results
    console.log("[Viator API] STEP 6: Checking results...")
    if (viatorResults.products.length === 0) {
      console.log("[Viator API] STEP 6: ✗ No products found")
      const popularDestinations = await getPopularDestinations(5)
      return NextResponse.json(
        {
          success: false,
          message: `No activities found in ${location}. Try adjusting your search criteria.`,
          suggestions: popularDestinations,
          step: "EMPTY_RESULTS"
        },
        { status: 404 }
      )
    }
    console.log("[Viator API] STEP 6: ✓ Results found")

    // Step 7: Transform products
    console.log("[Viator API] STEP 7: Transforming products...")
    let activities: any[]
    try {
      activities = viatorResults.products.map((product: any, index: number) => {
        try {
          const reviewText = product.reviews?.totalReviews
            ? `Rated ${product.reviews.combinedAverageRating}/5 by ${product.reviews.totalReviews} travelers`
            : "New experience"

          return {
            id: product.productCode,
            name: product.title,
            experience: truncateText(product.description, 200),
            bestFor: `Ideal for ${groupSize} seeking ${vibe || 'memorable experiences'}. ${reviewText}`,
            cost: product.pricing?.summary?.fromPrice || 0,
            currency: currency,
            duration: formatDuration(product.duration),
            locationType: inferLocationType(product.tags),
            activityLevel: inferActivityLevel(product.tags),
            specialElement: product.highlights?.[0] || "Unique local experience",
            preparation: buildPreparationText(product),
            tags: extractReadableTags(product.tags),
            viatorUrl: product.productUrl,
            rating: product.reviews?.combinedAverageRating,
            reviewCount: product.reviews?.totalReviews,
            image: selectBestImage(product.images),
            isBookable: true,
            confirmationType: product.bookingConfirmationSettings?.confirmationType || "MANUAL"
          }
        } catch (itemError: any) {
          console.error(`[Viator API] Failed to transform product ${index}:`, itemError.message)
          console.error(`[Viator API] Problem product:`, JSON.stringify(product, null, 2).substring(0, 500))
          throw new Error(`Failed to transform product at index ${index}: ${itemError.message}`)
        }
      })
      console.log("[Viator API] STEP 7: ✓ Products transformed, count:", activities.length)
    } catch (transformError: any) {
      console.error("[Viator API] STEP 7: ✗ Transformation failed", transformError.message)
      throw transformError
    }

    // Step 8: Build response
    console.log("[Viator API] STEP 8: Building response...")
    const response = {
      success: true,
      recommendations: {
        activities,
        proTips: [
          "Most activities offer free cancellation up to 24 hours in advance",
          "Instant confirmation products are confirmed immediately upon booking",
          "Prices shown are per person unless otherwise stated",
          "Check meeting point details and arrival instructions before your activity"
        ],
        refinementPrompts: [
          "Show only top-rated experiences",
          "More budget-friendly options",
          "Instant confirmation only",
          "Free cancellation available"
        ]
      },
      query: {
        location: location || "Worldwide",
        budget_per_person: budgetPerPerson,
        currency: currency,
        group_size: groupSize,
        vibe: vibe
      },
      isRealActivities: true,
      totalCount: viatorResults.totalCount
    }
    console.log("[Viator API] STEP 8: ✓ Response built")
    console.log("[Viator API] ===== REQUEST COMPLETED SUCCESSFULLY =====")

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("[Viator API] ===== FATAL ERROR =====")
    console.error("[Viator API] Error at unknown step")
    console.error("[Viator API] Error type:", error.constructor.name)
    console.error("[Viator API] Error message:", error.message)
    console.error("[Viator API] Full stack:", error.stack)
    console.error("[Viator API] Request body:", body ? JSON.stringify(body, null, 2) : "null")
    console.error("[Viator API] ====================")

    const errorResponse = {
      success: false,
      error: error.message || "Failed to search activities. Please try again.",
      errorType: error.constructor.name,
      step: "UNKNOWN",
      debugInfo: {
        hasApiKey: !!process.env.VIATOR_API_KEY,
        apiKeyLength: process.env.VIATOR_API_KEY?.length || 0,
        location: body?.location,
        budget: body?.budgetPerPerson,
        currency: body?.currency,
        timestamp: new Date().toISOString()
      }
    }
    
    if (error.message?.includes("not found") || error.message?.includes("Try")) {
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
